#!/usr/bin/env python
# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

def readversion(filename, varname):
    ''' Get the version without the need to execute the file '''
    version = None
    with open(filename, "r") as f:
        for line in f:
            if line.startswith(varname):
                version = line.split('=')[1].replace('"','').replace("'",'').strip()
    if version is None:
        raise Exception('Could not read version from file %s' % filename)
    return version


CLASSIFIERS = [
    'Environment :: Console',
    'Intended Audience :: Science/Research',
    'License :: OSI Approved :: GPLv3',
    'Operating System :: OS Independent',
    'Programming Language :: Python',
    'Topic :: Software Development :: Libraries :: Python Modules',
    'Development Status :: 1 - Planning',
    'Programming Language :: Python :: 2.7',
]

setup(
    name='atomica_apps',
    version=readversion(filename="./atomica_apps/version.py", varname='__version__'),
    author='Cliff Kerr, George Chadderdon, Parham Saidi, Vlad-Stefan Harbuz, James Jansson, Romesh Abeysuriya, Robyn Stuart',
    author_email='info@sciris.org',
    description='Frontend for Atomica',
    url='https://github.com/sciris/atomica_apps',
    keywords=['cascade', 'disease'],
    platforms=['OS Independent'],
    classifiers=CLASSIFIERS,
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'atomica', # Core library
        'sciris'
    ],
)
