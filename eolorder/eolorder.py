#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Bloque de tabla ordenada"""

import pkg_resources
from xblock.core import XBlock
from xblock.fields import String, Dict, Scope, Boolean, List, Float
from xblockutils.resources import ResourceLoader
from xblock.fragment import Fragment
import json
from django.template import Context, Template

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
        help="Usar letras mayúsculas en la numeración",
        scope=Scope.settings,
        default=False
    )

    ordeingelements = Dict(
        default={'1':{'content':'paso 1'}, '2':{'content':'paso a'}},
        scope=Scope.settings,
        help="Lista de elementos a ordenar"
    )

    random_order = Boolean(
        display_name="Orden aleatorio",
        help="Si está marcado, el orden se generará aleatoriamente para cada estudiante",
        scope=Scope.settings,
        default=True
    )

    custom_disorder = List(
        display_name="Orden personalizado",
        help="Lista de índices que define el orden desordenado (solo se usa si orden aleatorio está desactivado)",
        scope=Scope.settings,
        default=[]
    )

    has_score = True
    icon_class = "problem"
    weight = Float(
        display_name="Peso",
        help="Peso de la pregunta en la calificación",
        scope=Scope.settings,
        default=1.0
    )

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
        ordered_keys = sorted(self.ordeingelements.keys(), key=int)
        
        # Determinar el orden desordenado
        if self.random_order:
            import random
            disorder_keys = ordered_keys.copy()
            random.shuffle(disorder_keys)
        else:
            disorder_keys = self.custom_disorder if self.custom_disorder else ordered_keys
        
        # Crear los elementos en el orden desordenado
        for i, key in enumerate(disorder_keys):
            item = self.ordeingelements[key]
            elements.append({
                'key': key,
                'content': item['content'],
                'zero_index': str(i),
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
            'elements': elements,
            'ordered_keys': ordered_keys  # Guardamos las claves ordenadas para la evaluación
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
                # Si no hay elementos, reiniciar la numeración
                if not ordeingelements:
                    self.ordeingelements = {}
                else:
                    # Reordenar los elementos manteniendo la numeración secuencial
                    new_ordeingelements = {}
                    for i, (key, value) in enumerate(ordeingelements.items(), 1):
                        new_ordeingelements[str(i)] = value
                    self.ordeingelements = new_ordeingelements
            
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
            
            # Obtener las claves en el orden correcto
            correct_order = sorted(self.ordeingelements.keys(), key=int)
            
            # Verificar que el orden del estudiante coincida con el orden correcto
            student_order = [item['key'] for item in submitted_order]
            
            # Calcular la puntuación
            score = 1.0 if student_order == correct_order else 0.0
            
            # Guardar la calificación
            self.runtime.publish(
                self,
                'grade',
                {
                    'value': score * self.weight,
                    'max_value': self.weight
                }
            )
            
            return {
                'result': 'success',
                'score': score,
                'correct_order': correct_order,
                'student_order': student_order
            }
        except Exception as e:
            return {'result': 'error', 'message': str(e)}

    def _get_js_init(self):
        """
        Get the JS initialization function.
        """
        return "EolOrderXBlock" 