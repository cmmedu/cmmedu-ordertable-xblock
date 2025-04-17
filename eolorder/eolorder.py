#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Bloque de tabla ordenada"""

import pkg_resources
from xblock.core import XBlock
from xblock.fields import String, Dict, Scope, Boolean
from xblockutils.resources import ResourceLoader
from xblock.fragment import Fragment
import json

loader = ResourceLoader(__name__)

@XBlock.needs('i18n')
class EolOrderXBlock(XBlock):
    """
    XBlock para crear tablas ordenadas con diferentes tipos de numeración
    """
    display_name = String(
        display_name="Display Name",
        help="Nombre del componente",
        scope=Scope.settings,
        default="Eol Order Table XBlock"
    )

    table_name = String(
        display_name="Nombre de la tabla",
        help="Nombre que se mostrará en la cabecera de la tabla",
        scope=Scope.settings,
        default="Tabla Ordenada"
    )

    background_color = String(
        display_name="Color de fondo",
        help="Color de fondo de la tabla en formato hexadecimal",
        scope=Scope.settings,
        default="#ececec"
    )

    numbering_type = String(
        display_name="Tipo de numeración",
        help="Tipo de numeración para la primera columna",
        scope=Scope.settings,
        default="numbers",
        values=["numbers", "numbers_zero", "letters", "roman", "none"]
    )

    uppercase_letters = Boolean(
        display_name="Letras mayúsculas",
        help="Usar letras mayúsculas en la numeración",
        scope=Scope.settings,
        default=False
    )

    ordeingelements = Dict(
        default={'1':{'content':'paso 1'}, '2':{'content':'paso a'}},
        scope=Scope.settings,
        help="Lista de elementos a ordenar"
    )

    has_score = False
    icon_class = "problem"

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def build_fragment(
            self,
            rendered_template,
            initialize_js_func,
            additional_css=[],
            additional_js=[],
    ):
        """
        Create a fragment for display.
        """
        fragment = Fragment(rendered_template)
        for item in additional_css:
            fragment.add_css(self.resource_string(item))
        for item in additional_js:
            fragment.add_javascript(self.resource_string(item))
        fragment.initialize_js(initialize_js_func)
        return fragment

    def student_view(self, context=None):
        """
        The primary view of the EolOrderXBlock, shown to students
        when viewing courses.
        """
        context = {
            'table_name': self.table_name,
            'background_color': self.background_color,
            'numbering_type': self.numbering_type,
            'uppercase_letters': self.uppercase_letters,
            'ordeingelements': self.ordeingelements
        }
        
        html = loader.render_template('static/html/eolorder.html', context)
        frag = self.build_fragment(
            html,
            self._get_js_init(),
            ['static/css/eolorder.css'],
            ['static/js/src/eolorder.js']
        )
        return frag

    def studio_view(self, context=None):
        """
        The view shown in Studio when editing the XBlock.
        """
        context = {
            'table_name': self.table_name,
            'background_color': self.background_color,
            'numbering_type': self.numbering_type,
            'uppercase_letters': self.uppercase_letters,
            'ordeingelements': self.ordeingelements
        }
        
        html = loader.render_template('static/html/eolorder_studio.html', context)
        frag = self.build_fragment(
            html,
            self._get_js_init(),
            ['static/css/eolorder_studio.css'],
            ['static/js/src/eolorder_studio.js']
        )
        return frag

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Handle studio submissions.
        """
        try:
            self.table_name = data.get('table_name', self.table_name)
            self.background_color = data.get('background_color', self.background_color)
            self.numbering_type = data.get('numbering_type', self.numbering_type)
            self.uppercase_letters = data.get('uppercase_letters', self.uppercase_letters)
            
            # Asegurarse de que ordeingelements sea un diccionario válido
            ordeingelements = data.get('ordeingelements', {})
            if isinstance(ordeingelements, dict):
                self.ordeingelements = ordeingelements
            
            return {'result': 'success'}
        except Exception as e:
            return {'result': 'error', 'message': str(e)}

    @XBlock.json_handler
    def add_row(self, data, suffix=''):
        """
        Add a new row to the table.
        """
        row_id = str(len(self.ordeingelements) + 1)
        self.ordeingelements[row_id] = {
            'content': data.get('content', '')
        }
        return {'result': 'success', 'row_id': row_id}

    def _get_js_init(self):
        """
        Get the JS initialization function.
        """
        return "EolOrderXBlock" 