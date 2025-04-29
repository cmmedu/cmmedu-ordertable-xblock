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

@register.filter
def split(value, delimiter):
    """
    Split a string by the given delimiter.
    Usage in template: {{ value|split:"delimiter" }}
    """
    if not value:
        return []
    return value.split(delimiter)

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

    correct_answers = String(
        default="1_2",
        scope=Scope.settings,
        help="Lista respuestas correctas, se asume como respuesta correcta los elementos ordenados del primero al último tal como en la lista 'elementos a ordenar 1_2_..._n', considere agregar mas grupos de respuestas correctas solamente si existe mas de una respuesta correcta"
    )

    disordered_order = String(
        default="",
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

        # Convertir el orden desordenado a lista para la vista del estudiante
        disordered_order_list = []
        if self.disordered_order:
            disordered_order_list = self.disordered_order.split('_')

        context = {
            'table_name': self.table_name,
            'background_color': self.background_color,
            'numbering_type': self.numbering_type,
            'uppercase_letters': self.uppercase_letters,
            'correct_answers': self.correct_answers,
            'random_disorder': self.random_disorder,
            'elements': elements,
            'correct_answers': self.correct_answers,
            'disordered_order': disordered_order_list
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
        # Asegurarse de que el orden desordenado sea un string
        if not self.disordered_order:
            self.disordered_order = '_'.join([str(key) for key in self.ordeingelements.keys()])
        elif isinstance(self.disordered_order, list):
            self.disordered_order = '_'.join([str(item) for item in self.disordered_order])
        
        # Convertir el orden desordenado a lista para la vista del editor
        disordered_order_list = []
        if self.disordered_order:
            disordered_order_list = self.disordered_order.split('_')
        
        # Asegurarse de que correct_answers sea un string válido
        if not self.correct_answers:
            self.correct_answers = '_'.join([str(key) for key in self.ordeingelements.keys()])
        
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
                'value': disordered_order_list,
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
        
        # Add the disordered order as a data attribute
        frag.add_javascript("""
            $(function() {
                $('.eolorder-studio').data('disordered-order', '%s');
            });
        """ % self.disordered_order)
        
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
                self.ordeingelements = ordeingelements
            
            # Guardar el orden desordenado como string
            disordered_order = data.get('disordered_order', '')
            print("Received disordered_order:", disordered_order)
            print("Type of disordered_order:", type(disordered_order))
            
            # Asegurarse de que disordered_order sea un string válido
            if isinstance(disordered_order, str):
                if disordered_order:
                    # Verificar que el string tenga el formato correcto
                    if not disordered_order.startswith('_') and not disordered_order.endswith('_'):
                        self.disordered_order = disordered_order
                    else:
                        # Limpiar el string si tiene guiones bajos al inicio o final
                        self.disordered_order = disordered_order.strip('_')
                else:
                    # Si está vacío, generar un nuevo orden
                    self.disordered_order = '_'.join([str(key) for key in self.ordeingelements.keys()])
            elif isinstance(disordered_order, list):
                # Convertir lista a string
                self.disordered_order = '_'.join([str(item) for item in disordered_order])
            else:
                # Si no es string ni lista, generar un nuevo orden
                self.disordered_order = '_'.join([str(key) for key in self.ordeingelements.keys()])
            
            print("Saving disordered order:", self.disordered_order)
            print("Type of saved disordered_order:", type(self.disordered_order))
            
            # Guardar las respuestas correctas
            correct_answers = data.get('correct_answers', '')
            print("Received correct_answers:", correct_answers)
            print("Type of correct_answers:", type(correct_answers))
            
            if isinstance(correct_answers, str):
                # Limpiar el string si tiene guiones bajos al inicio o final
                correct_answers = correct_answers.strip('_')
                # Asegurarse de que el formato sea correcto
                if correct_answers:
                    # Verificar si ya tiene el formato correcto con _[|]_
                    if '_[|]_' in correct_answers:
                        self.correct_answers = correct_answers
                    else:
                        # Si no tiene el formato correcto, asumimos que es una sola lista
                        # y la convertimos al formato correcto
                        self.correct_answers = correct_answers
                else:
                    # Si está vacío, generar un orden por defecto
                    default_order = '_'.join([str(key) for key in self.ordeingelements.keys()])
                    self.correct_answers = default_order
            else:
                # Si no es string, generar un orden por defecto
                default_order = '_'.join([str(key) for key in self.ordeingelements.keys()])
                self.correct_answers = default_order
            
            print("Saving correct answers:", self.correct_answers)
            
            # Actualizar el atributo de datos para el frontend
            self.runtime.publish(self, 'edx.xblock.studio_submit', {
                'disordered_order': self.disordered_order,
                'correct_answers': self.correct_answers
            })
            
            return {
                'result': 'success',
                'disordered_order': self.disordered_order,
                'correct_answers': self.correct_answers
            }
        except Exception as e:
            print("Error saving data:", str(e))
            print("Error type:", type(e))
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

    def get_correct_answers_list(self):
        """
        Convierte el string de respuestas correctas en una lista de listas.
        Ejemplo: "1_2_3_[|]_1_3_2" -> [["1", "2", "3"], ["1", "3", "2"]]
        """
        if not self.correct_answers:
            return []
        
        print("Getting correct answers list from:", self.correct_answers)
        
        # Separar las listas usando _[|]_
        lists = self.correct_answers.split('_[|]_')
        print("Split lists:", lists)
        
        # Convertir cada lista en un array de elementos
        result = []
        for list_str in lists:
            # Limpiar espacios en blanco y separar por _
            elements = [elem.strip() for elem in list_str.split('_') if elem.strip()]
            if elements:
                result.append(elements)
        
        print("Result:", result)
        return result

    def set_correct_answers_list(self, answers_list):
        """
        Convierte una lista de listas en un string de respuestas correctas.
        Ejemplo: [["1", "2", "3"], ["1", "3", "2"]] -> "1_2_3_[|]_1_3_2"
        """
        if not answers_list:
            self.correct_answers = ""
            return
        
        print("Setting correct answers list:", answers_list)
        
        # Convertir cada lista en un string separado por _
        lists_str = []
        for answer_list in answers_list:
            if answer_list:
                lists_str.append('_'.join(str(elem) for elem in answer_list))
        
        # Unir las listas con _[|]_
        self.correct_answers = '_[|]_'.join(lists_str)
        print("Result string:", self.correct_answers) 