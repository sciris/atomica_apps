# This file contains helper functions for working with optimizations in Atomica-based apps
# Specifially, it manages initialization of the JSON structures required by the FE as well
# as implementing the method required to construct an at.Optimization from the JSON

import sciris as sc
import atomica as at

def default_optim_json(proj: at.Project, tool: str, optim_type:str = 'outcome') -> dict:
    """
    Return FE JSON dict for a default scenario of given type

    Note that if optim_type='money' then the optimization 'weights' entered in the FE are
    actually treated as relative scalings for the minimization target. e.g. If ':ddis' has a weight
    of 25, this is a objective weight factor for optim_type='outcome' but it means 'we need to reduce
    deaths by 25%' if optim_type='money' (since there is no weight factor for the minimize money epi targets)

    :param tool: ``'cascade'`` or ``'tb'``
    :param optim_type: set to ``'outcome'`` or ``'money'`` - use ``'money'`` to minimize money
    :return: If ``dorun=True``, return list of results. Otherwise, returns an ``OptimInstructions`` instance

    """

    if optim_type is None:
        optim_type = 'outcome'
    assert tool in ['cascade', 'tb']
    assert optim_type in ['outcome', 'money']
    json = sc.odict()
    if optim_type == 'outcome':
        json['name'] = 'Default outcome optimization'
    elif optim_type == 'money':
        json['name'] = 'Default money optimization'
    json['parset_name'] = -1
    json['progset_name'] = -1
    json['start_year'] = proj.data.end_year
    json['adjustment_year'] = proj.data.end_year
    json['end_year'] = proj.settings.sim_end
    json['budget_factor'] = 1.0
    json['optim_type'] = optim_type
    json['tool'] = tool
    json['method'] = 'asd'  # Note: may want to change this if PSO is improved

    if tool == 'cascade':
        json['objective_weights'] = sc.odict()
        json['objective_labels'] = sc.odict()

        for cascade_name in proj.framework.cascades:
            cascade = at.sanitize_cascade(proj.framework, cascade_name)[1]

            if optim_type == 'outcome':
                json['objective_weights']['conversion:%s' % (cascade_name)] = 1.
            elif optim_type == 'money':
                json['objective_weights']['conversion:%s' % (cascade_name)] = 0.
            else:
                raise Exception('Unknown optim_type')

            if cascade_name.lower() == 'cascade':
                json['objective_labels']['conversion:%s' % (cascade_name)] = 'Maximize the conversion rates along each stage of the cascade'
            else:
                json['objective_labels']['conversion:%s' % (cascade_name)] = 'Maximize the conversion rates along each stage of the %s cascade' % (cascade_name)

            for stage_name in cascade.keys():
                # We checked earlier that there are no ':' symbols here, but asserting that this is true, just in case
                assert ':' not in cascade_name
                assert ':' not in stage_name
                objective_name = 'cascade_stage:%s:%s' % (cascade_name, stage_name)

                if optim_type == 'outcome':
                    json['objective_weights'][objective_name] = 1
                elif optim_type == 'money':
                    json['objective_weights'][objective_name] = 0
                else:
                    raise Exception('Unknown optim_type')

                if cascade_name.lower() == 'cascade':
                    json['objective_labels'][objective_name] = 'Maximize the number of people in cascade stage "%s"' % (stage_name)
                else:
                    json['objective_labels'][objective_name] = 'Maximize the number of people in stage "%s" of the %s cascade' % (stage_name, cascade_name)

    elif tool == 'tb':
        if optim_type == 'outcome':
            json['objective_weights'] = {'daly_rate': 0, ':ddis': 1, ':acj': 1, 'ds_inf': 0, 'mdr_inf': 0, 'xdr_inf': 0}  # These are TB-specific: maximize people alive, minimize people dead due to TB
            json['objective_labels'] = {'daly_rate': 'Minimize DALYs',
                                        ':ddis': 'Minimize TB-related deaths',
                                        ':acj': 'Minimize total new active TB infections',
                                        'ds_inf': 'Minimize prevalence of active DS-TB',
                                        'mdr_inf': 'Minimize prevalence of active MDR-TB',
                                        'xdr_inf': 'Minimize prevalence of active XDR-TB'}
        elif optim_type == 'money':
            # The weights here default to 0 because it's possible, depending on what programs are selected, that improvement
            # in one or more of them might be impossible even with infinite money. Also, can't increase money too much because otherwise
            # run the risk of a local minimum stopping optimization early with the current algorithm (this will change in the future)
            json['objective_weights'] = {'daly_rate': 0, ':ddis': 0, ':acj': 5, 'ds_inf': 0, 'mdr_inf': 0, 'xdr_inf': 0}  # These are TB-specific: maximize people alive, minimize people dead due to TB
            json['objective_labels'] = {'daly_rate': 'Minimize DALYs',
                                        ':ddis': 'Minimize TB-related deaths',
                                        ':acj': 'Total new active TB infections',
                                        'ds_inf': 'Prevalence of active DS-TB',
                                        'mdr_inf': 'Prevalence of active MDR-TB',
                                        'xdr_inf': 'Prevalence of active XDR-TB'}

        else:
            raise Exception('Unknown optim_type')

    else:
        raise Exception('Tool "%s" not recognized' % tool)
    json['maxtime'] = 30  # WARNING, default!
    json['prog_spending'] = sc.odict()
    for prog_name in proj.progset().programs.keys():
        json['prog_spending'][prog_name] = [0, None]

    return json

def make_optimization(proj: at.Project, json: dict) -> at.Optimization:
    """
    Construct and return an at.Optimization from JSON

    The FE and RPCs work with a JSON-representation of optimizations matching the fields
    in the FE. This function handles turning the JSON-dict into an at.Optimization.

    This function also returns two sets of instructions
    - Initialization instructions
    - Baseline instructions

    The baseline instructions correspond to the unoptimized instructions - for example, with
    default spending, or with a doubled budget.

    In the case where a money minimization is being performed, the optimization should be initialized
    with the maximum possible spend - either by scaling up the initial values, or using the user-specified
    upper bounds for each program. Thus, the initial instructions for the algorithm do NOT correspond to
    baseline spending, they correspond to the upper bound of spending which is then incrementally decreased
    to perform money minimization.

    Thus, the `initial_instructions` should be passed to `at.optimize()` while the `baseline_instructions`
    should be used to generate the baseline result. After running optimization, the `initial_instructions`
    can be discarded, but the baseline result should be retained to serve as the unoptimized counterfactual.

    :param proj: A at.Project instance
    :param json: A FE JSON optimization dict - the type returned by default_optim_json and stored in proj.optim_jsons
    :return: Tuple containing (optimization, initial_instructions, baseline_instructions)

    """

    name = json['name']
    parset_name = json['parset_name']  # WARNING, shouldn't be unused
    progset_name = json['progset_name']
    budget_factor = json['budget_factor']
    objective_weights = json['objective_weights']
    prog_spending = json['prog_spending']
    maxtime = json['maxtime']
    optim_type = json['optim_type']
    tool = json['tool']
    method = json.get('method', None)

    start_year = json['start_year']  # The year when programs turn on
    adjustment_year = json['adjustment_year']  # The year when adjustments get made
    end_year = json['end_year']  # For cascades, this is the evaluation year. For other measurables, it is optimized from the adjustment year to the end year

    if tool == 'cascade' and optim_type == 'money':
        raise NotImplementedError('Money minimization not yet implemented for Cascades tool')

    progset = proj.progsets[progset_name]  # Retrieve the progset

    # Set up the initial allocation and program instructions
    baseline_instructions = at.ProgramInstructions(alloc=progset, start_year=start_year)  # passing in the progset means we fix the spending in the start year
    initial_instructions = sc.dcp(baseline_instructions)

    # Add a spending adjustment in the start/optimization year for every program in the progset, using the lower/upper bounds
    # passed in as arguments to this function
    adjustments = []
    default_spend = progset.get_alloc(tvec=adjustment_year, instructions=baseline_instructions)  # Record the default spend for scale-up in money minimization
    for prog_name in progset.programs:
        limits = list(sc.dcp(prog_spending[prog_name]))
        if limits[0] is None:
            limits[0] = 0.0
        if limits[1] is None and optim_type == 'money':
            # Money minimization requires an absolute upper bound. Limit it to 5x default spend by default
            limits[1] = 10 * default_spend[prog_name]
        adjustments.append(at.SpendingAdjustment(prog_name, t=adjustment_year, limit_type='abs', lower=limits[0], upper=limits[1]))

        if optim_type == 'money':
            # Modify default spending to see if more money allows target to be met at all
            if limits[1] is not None and np.isfinite(limits[1]):
                initial_instructions.alloc[prog_name].insert(adjustment_year, limits[1])
            else:
                initial_instructions.alloc[prog_name] = at.TimeSeries(adjustment_year, 5 * default_spend[prog_name])

    if optim_type == 'outcome':
        # Add a total spending constraint with the given budget scale up
        # For money minimization we do not need to do this
        constraints = [at.TotalSpendConstraint(budget_factor=budget_factor)]
    else:
        constraints = None

    # Add all of the terms in the objective
    measurables = []
    for mname, mweight in objective_weights.items():

        if not mweight:
            continue

        if tool == 'cascade':
            tokens = mname.split(':')
            if tokens[0] == 'cascade_stage':  # Parse a measurable name like 'cascade_stage:Default:All diagnosed'
                measurables.append(at.MaximizeCascadeStage(cascade_name=tokens[1], t=[end_year], pop_names='all', cascade_stage=tokens[2], weight=mweight))
            elif tokens[0] == 'conversion':  # Parse a measurable name like 'conversions:Default'
                measurables.append(at.MaximizeCascadeConversionRate(cascade_name=tokens[1], t=[end_year], pop_names='all', weight=mweight))
            else:
                raise Exception('Unknown measurable "%s"' % (mname))
        else:
            if optim_type == 'money':
                # For money minimization, use at AtMostMeasurable to meet the target by the end year.
                # The weight stores the threshold value
                measurables.append(at.AtMostMeasurable(mname, t=end_year, threshold=mweight))
            else:
                measurables.append(at.Measurable(mname, t=[adjustment_year, end_year], weight=mweight))

    if optim_type == 'money':
        # Do a prerun to convert the optimization targets into absolute units
        result = proj.run_sim(proj.parsets[parset_name], progset=progset, progset_instructions=baseline_instructions, store_results=False)
        for measurable in measurables:
            val = measurable.get_objective_val(result.model)  # This is the baseline value for the quantity being thresholded
            assert measurable.threshold <= 100 and measurable.threshold >= 0
            measurable.threshold = val * (1 - measurable.threshold / 100.)

        # Then, add extra measurables for program spending
        for prog in progset.programs.values():
            measurables.append(at.MinimizeMeasurable(prog.name, adjustment_year))  # Minimize 2020 spending on Treatment 1

    # Create the Optimization object
    optim = at.Optimization(name=name, parsetname=parset_name, progsetname=progset_name, adjustments=adjustments, measurables=measurables, constraints=constraints, maxtime=maxtime)

    # Set the method used for optimization
    if method is not None:
        optim.method = method
    elif optim_type == 'money':
        optim.method = 'pso'

    # Baseline instructions - the actual initial allocation
    # Initial instructions - instructions with the optimization initial allocation (scaled up for money minimization)
    return optim, baseline_instructions, initial_instructions


def run_json_optimization(proj: at.Project, optimname: str, maxtime:float =None, maxiters:int =None) -> tuple:
    """
    Run an optimization from a named JSON

    This function is used by the FE to run optimizations based on a JSON contained
    within `proj.optim_jsons`.

    :param proj: a Project instance
    :param optimname: The name of an optimization (needs to match the 'name' stored in one of `proj.optim_jsons`)
    :param maxtime: Optionally specify maximum run time
    :param maxiters: Optionally specify maximum number of iterations
    :return: Tuple containing (unoptimized_result, optimized_result)
    """

    for json in proj.optim_jsons:
        if json['name'] == optimname:
            break
    else:
        raise Exception('Could not find any optim json with name "%s"' % (optimname))

    optim, baseline_instructions, initial_instructions = make_optimization(proj,json)
    if maxtime is not None:
        optim.maxtime = maxtime
    if maxiters is not None:
        optim.maxiters = maxiters
    parset = proj.parset(optim.parsetname)
    progset = proj.progset(optim.progsetname)
    original_end = proj.settings.sim_end
    proj.settings.sim_end = json['end_year']  # Simulation should be run up to the user's end year
    try:
        optimized_instructions = at.optimize(proj, optim, parset, progset, initial_instructions)
    except at.InvalidInitialConditions:
        if json['optim_type'] == 'money':
            raise Exception('It was not possible to achieve the optimization target even with an increased budget. Specify or raise upper limits for spending, or decrease the optimization target')
        else:
            raise  # Just raise it as-is

    proj.settings.sim_end = original_end  # Note that if the end year is after the original simulation year, the result won't be visible (although it will have been optimized for)
    optimized_result = proj.run_sim(parset=parset, progset=progset, progset_instructions=optimized_instructions, result_name="Optimized")
    unoptimized_result = proj.run_sim(parset=parset, progset=progset, progset_instructions=baseline_instructions, result_name="Baseline")
    return unoptimized_result, optimized_result