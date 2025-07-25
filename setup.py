import os
from setuptools import setup

def package_data(pkg, roots):
    """Generic function to find package_data.
    All of the files under each of the `roots` will be declared as package
    data for package `pkg`.
    """
    data = []
    for root in roots:
        for dirname, _, files in os.walk(os.path.join(pkg, root)):
            for fname in files:
                data.append(os.path.relpath(os.path.join(dirname, fname), pkg))

    return {pkg: data}

setup(
    name='cmmedu-ordertable-xblock',
    version='1.0.1',
    description='XBlock for ordering items',
    packages=[
    ],
    install_requires=[
        'XBlock',
        'xblock-utils',
    ],
    entry_points={
        'xblock.v1': [
            'ordertable = ordertable.ordertable:CmmEduOrderTableXBlock',
        ]
    },
    package_data=package_data("ordertable", ["static", "public"]),
) 