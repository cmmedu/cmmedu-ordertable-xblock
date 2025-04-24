#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Bloque de tabla ordenada"""

import pkg_resources
from xblock.core import XBlock
from xblock.fields import String, Dict, Scope, Boolean, List
from xblockutils.resources import ResourceLoader
from xblock.fragment import Fragment
import json
from django.template import Context, Template
from django.template.defaulttags import register

@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)

loader = ResourceLoader(__name__)

def number_to_letter(n, uppercase=True):
    """Convert number to letter (1=A, 2=B, etc.)"""
    if n < 1:
        return ''
    result = ''
    while n > 0:
        n, remainder = divmod(n - 1, 26)
        result = chr(65 + remainder) + result
    return result if uppercase else result.lower()

def number_to_roman(n, uppercase=True):
    """Convert number to roman numeral"""
    if not 0 < n < 4000:
        return ''
    ints = (1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1)
    nums = ('M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I')
    result = []
    for i in range(len(ints)):
        count = int(n / ints[i])
        result.append(nums[i] * count)
        n -= ints[i] * count
    return ''.join(result) if uppercase else ''.join(result).lower()

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
        help="Usar letras mayúsculas en la numeración (solo aplicable a letras)",
        scope=Scope.settings,
        default=False
    )

    ordeingelements = Dict(
        default={1: {'content':'paso 1'}, 2: {'content':'paso a'}},
        scope=Scope.settings,
        help="Lista de elementos a ordenar"
    )

    correct_answers = List(
        default=[],
        scope=Scope.settings,
        help="Lista respuestas correctas"
    )

    disordered_order = List(
        default=[],
        scope=Scope.settings,
        display_name="Orden desordenado",
        help="Orden desordenado para mostrar a los estudiantes"
    )

    random_disorder = Boolean(
        display_name="Desordenar aleatoriamente",
        help="Desordenar aleatoriamente los elementos (anulando el arreglo de orden desordenado)",
        scope=Scope.settings,
        default=False
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
        # Preparar los elementos con la numeración correcta
        elements = []
        for i, (key, item) in enumerate(self.ordeingelements.items()):
            elements.append({
                'key': int(key) if isinstance(key, str) else key,
                'content': item['content'],
                'zero_index': i,
                'letter_upper': number_to_letter(i + 1, True),
                'letter_lower': number_to_letter(i + 1, False),
                'roman_upper': number_to_roman(i + 1, True),
                'roman_lower': number_to_roman(i + 1, False)
            })

        context = {
            'table_name': self.table_name,
            'background_color': self.background_color,
            'numbering_type': self.numbering_type,
            'uppercase_letters': self.uppercase_letters,
            'correct_answers': self.correct_answers,
            'random_disorder': self.random_disorder,
            'elements': elements,
            'correct_answers': self.correct_answers,
            'disordered_order': self.disordered_order
        }
        
        html = loader.render_template('static/html/eolorder.html', context)
        frag = self.build_fragment(
            html,
            self._get_js_init(),
            ['static/css/eolorder.css'],
            ['static/js/eolorder.js']
        )
        return frag

    def studio_view(self, context=None):
        """
        The view shown in Studio when editing the XBlock.
        """
        # Si no hay orden desordenado, generarlo
        if not self.disordered_order:
            self.disordered_order = [int(key) for key in self.ordeingelements.keys()]
        
        context = {
            'table_name': {
                'value': self.table_name,
                'display_name': self.fields['table_name'].display_name,
                'help': self.fields['table_name'].help
            },
            'background_color': {
                'value': self.background_color,
                'display_name': self.fields['background_color'].display_name,
                'help': self.fields['background_color'].help
            },
            'numbering_type': {
                'value': self.numbering_type,
                'display_name': self.fields['numbering_type'].display_name,
                'help': self.fields['numbering_type'].help
            },
            'uppercase_letters': {
                'value': self.uppercase_letters,
                'display_name': self.fields['uppercase_letters'].display_name,
                'help': self.fields['uppercase_letters'].help
            },
            'ordeingelements': {
                'value': self.ordeingelements,
                'display_name': 'Elementos a ordenar',
                'help': self.fields['ordeingelements'].help
            },
            'correct_answers': {
                'value': self.correct_answers,
                'display_name': 'Respuestas correctas',
                'help': self.fields['correct_answers'].help
            },
            'disordered_order': {
                'value': self.disordered_order,
                'display_name': self.fields['disordered_order'].display_name,
                'help': self.fields['disordered_order'].help
            },
            'random_disorder': {
                'value': self.random_disorder,
                'display_name': self.fields['random_disorder'].display_name,
                'help': self.fields['random_disorder'].help
            }
        }
        
        html = loader.render_template('static/html/eolorder_studio.html', context)
        frag = self.build_fragment(
            html,
            self._get_js_init(),
            ['static/css/eolorder_studio.css'],
            ['static/js/drag-and-drop.js', 'static/js/eolorder_studio.js']
        )
        
        # Add the JavaScript file directly to the fragment
        frag.add_javascript(self.resource_string('static/js/drag-and-drop.js'))
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
            self.random_disorder = data.get('random_disorder', self.random_disorder)
            # Asegurarse de que ordeingelements sea un diccionario válido
            ordeingelements = data.get('ordeingelements', {})
            if isinstance(ordeingelements, dict):
                # Si no hay elementos, reiniciar la numeración
                if not ordeingelements:
                    self.ordeingelements = {}
                    self.disordered_order = []
                else:
                    # Reordenar los elementos manteniendo la numeración secuencial
                    new_ordeingelements = {}
                    for i, (key, value) in enumerate(ordeingelements.items(), 1):
                        new_ordeingelements[str(i)] = value
                    self.ordeingelements = new_ordeingelements
                    
                    # Actualizar el orden desordenado si es necesario
                    if not self.disordered_order or len(self.disordered_order) != len(new_ordeingelements):
                        self.disordered_order = list(new_ordeingelements.keys())
            
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

    @XBlock.json_handler
    def submit_answer(self, data, suffix=''):
        """
        Handle student submissions.
        """
        try:
            # Obtener el orden enviado por el estudiante
            submitted_order = data.get('order', [])
            
            # Verificar que el orden sea válido
            if not submitted_order:
                return {'result': 'error', 'message': 'No se recibió ningún orden'}
            
            # Crear un nuevo diccionario con el orden y contenido actualizado
            new_elements = {}
            for item in submitted_order:
                if item['key'] in self.ordeingelements:
                    new_elements[item['key']] = {
                        'content': item['content']
                    }
            
            # Actualizar el orden de los elementos
            self.ordeingelements = new_elements
            
            return {'result': 'success'}
        except Exception as e:
            return {'result': 'error', 'message': str(e)}

    def _get_js_init(self):
        """
        Get the JS initialization function.
        """
        return "EolOrderXBlock" 