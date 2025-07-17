#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Bloque de tabla ordenada"""

import pkg_resources
from xblock.core import XBlock
from xblock.fields import String, Dict, Scope, Boolean, List, Integer, Float
from xblockutils.resources import ResourceLoader
from xblock.fragment import Fragment
import json
from django.template import Context, Template
from django.template.defaulttags import register
import random  # Agregamos la importación de random

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
class CmmEduOrderTableXBlock(XBlock):
    """
    XBlock para crear tablas ordenadas con diferentes tipos de numeración
    """
    display_name = String(
        display_name="Display Name",
        help="Nombre del componente",
        scope=Scope.settings,
        default="CmmEdu Order Table XBlock"
    )

    table_name = String(
        display_name="Nombre de la tabla",
        help="Nombre que se mostrará en la cabecera de la tabla, vacio para no incluir la cabecera",
        scope=Scope.settings,
        default="Tabla Ordenada"
    )

    textcolumn_order = String(
        display_name="Texto de la columna de orden",
        help="Texto que se mostrará en la columna de orden",
        scope=Scope.settings,
        default="Orden"
    )

    textcolumn_content = String(
        display_name="Texto de la columna de contenido",
        help="Texto que se mostrará en la columna de contenido",
        scope=Scope.settings,
        default="Elementos a ordenar"
    )

    textcolumn_actions = String(
        display_name="Texto de la columna de acciones",
        help="Texto que se mostrará en la columna de acciones",
        scope=Scope.settings,
        default="Acciones"
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

    label_width = String(
        display_name="Ancho de la columna de etiquetas",
        help="Ancho de la columna de etiquetas en porcentaje, recuerde incluir el % o el px",
        scope=Scope.settings,
        default="15%"
    )

    use_custom_labels = Boolean(
        display_name="Usar etiquetas personalizadas",
        help="Usar etiquetas personalizadas para la primera columna",
        scope=Scope.settings,
        default=False
    )

    custom_labels = Dict(
        display_name="Etiquetas personalizadas",
        help="Etiquetas personalizadas para la primera columna",
        scope=Scope.settings,
        default={1: {'content':''}, 2: {'content':''}}
    )

    pretext_num = String(
        display_name="Texto antes de la numeración",
        help="Texto que se mostrará antes del simbolo de la numeración, vacio se asume no hay texto previo",
        scope=Scope.settings,
        default=""
    )

    postext_num = String(
        display_name="Texto después de la numeración",
        help="Texto que se mostrará después del simbolo de la numeración, vacio se asume no hay texto posterior",
        scope=Scope.settings,
        default=""
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
        help="Lista de elementos a ordenar. El contenido puede incluir HTML para formato (negritas, subrayado, imágenes, etc.)"
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
        help="Desordenar aleatoriamente los elementos (anulando el arreglo de orden desordenado) Cada estudiante verá un desorden diferente y cambiara cada vez que se acceda al problema sin responder",
        scope=Scope.settings,
        default=False
    )

    show_answer = String(
        display_name="Mostrar respuesta",
        help="Controla cuándo se muestra la respuesta correcta",
        scope=Scope.settings,
        default="when_attempts_run_out",
        values=[
            {"display_name": "Cuando se agotan los intentos", "value": "when_attempts_run_out"},
            {"display_name": "Nunca", "value": "never"}
        ]
    )

    text_before_answer = String(
        display_name="Texto antes de la respuesta correcta",
        default="",
        scope=Scope.settings,
        help="Texto que se mostrará antes de la respuesta correcta, solo se mostrara si hay texto en el campo"
    )

    has_score = True
    icon_class = "problem"

    weight = Integer(
        display_name='Peso',
        help='Entero que representa el peso del problema',
        default=1,
        values={'min': 0},
        scope=Scope.settings,
    )

    max_attempts = Integer(
        display_name='Nro. de Intentos',
        help='Entero que representa cuantas veces se puede responder problema',
        default=2,
        values={'min': 0},
        scope=Scope.settings,
    )

    attempts = Integer(
        display_name='Intentos',
        help='Cuantas veces el estudiante ha intentado responder',
        default=0,
        values={'min': 0},
        scope=Scope.user_state,
    )

    score = Float(
        default=0.0,
        scope=Scope.user_state,
    )

    user_answer = String(
        default="",
        scope=Scope.user_state,
        help="Respuesta enviada por el usuario"
    )


    
    

    editable_fields = ('display_name', 'table_name', 'textcolumn_order', 'textcolumn_content', 'textcolumn_actions', 'background_color', 'numbering_type', 'pretext_num', 'postext_num', 'uppercase_letters', 'ordeingelements', 'correct_answers', 'disordered_order', 'random_disorder', 'weight', 'max_attempts', 'show_answer', 'label_width', 'use_custom_labels', 'custom_labels', 'text_before_answer')

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
        settings = {
            'image_path': self.runtime.local_resource_url(self, 'static/images/'),
            'sublocation': str(self.location).split('@')[-1],
            'ordeingelements': self.ordeingelements,
            'max_attempts': self.max_attempts,
            'table_name': self.table_name,
            'textcolumn_order': self.textcolumn_order,
            'textcolumn_content': self.textcolumn_content,
            'textcolumn_actions': self.textcolumn_actions,
            'pretext_num': self.pretext_num,
            'postext_num': self.postext_num,
            'numbering_type': self.numbering_type,
            'label_width': self.label_width,
            'use_custom_labels': self.use_custom_labels,
            'custom_labels': self.custom_labels,
            'uppercase_letters': self.uppercase_letters,
            'correct_answers': self.correct_answers,
            'disordered_order': self.disordered_order,
            'random_disorder': self.random_disorder,
            'text_before_answer': self.text_before_answer
        }

        fragment.initialize_js(initialize_js_func, json_args=settings)

        return fragment

    def student_view(self, context=None):
        """
        The primary view of the CmmOrderXBlock, shown to students
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

        # Determinar el orden a mostrar para el contenido
        content_order = []
        
        # Caso 1: No hay intentos - Mostrar orden desordenado
        if self.attempts == 0:
            if self.random_disorder:
                # Generar un orden aleatorio
                content_order = [str(key) for key in self.ordeingelements.keys()]
                random.shuffle(content_order)
            elif self.disordered_order:
                content_order = self.disordered_order.split('_')
            else:
                content_order = [str(key) for key in self.ordeingelements.keys()]
        # Caso 2: Hay intentos Mostrar respuesta guardada del usuario
        elif self.attempts > 0:
            if self.user_answer:
                content_order = self.user_answer.split('_')
            else:
                # Si no hay respuesta guardada, mantener el último orden mostrado
                content_order = [str(key) for key in self.ordeingelements.keys()]
                # Si la respuesta es correcta y no hay respuesta guardada, se muestra la primera respuesta correcta
                if self.score > 0:
                    if self.correct_answers: # Si por alguna razon se pierde la respuesta del usuario, se muestra la primera respuesta correcta
                        content_order = self.correct_answers.split('_[|]_')[0].split('_')

        # Reordenar los elementos según el orden a mostrar
        ordered_elements = []
        for i, key in enumerate(content_order):
            for element in elements:
                if str(element['key']) == str(key):
                    # Usar el índice de posición (i+1) para la numeración de la primera columna
                    # y mantener el key original para la verificación de respuestas
                    ordered_elements.append({
                        'key': element['key'],  # Mantener el key original para verificación
                        'content': element['content'],
                        'position': i + 1,  # Índice de posición para la primera columna
                        'zero_index': i,
                        'letter_upper': number_to_letter(i + 1, True),
                        'letter_lower': number_to_letter(i + 1, False),
                        'roman_upper': number_to_roman(i + 1, True),
                        'roman_lower': number_to_roman(i + 1, False)
                    })
                    break

        # Calcular el texto de intentos
        texto_intentos = ''
        no_mas_intentos = False
        if self.max_attempts and self.max_attempts > 0:
            texto_intentos = "Ha realizado "+str(self.attempts)+" de "+str(self.max_attempts)+" intentos"
            if self.max_attempts == 1:
                texto_intentos = "Ha realizado "+str(self.attempts)+" de "+str(self.max_attempts)+" intento"
            if self.attempts >= self.max_attempts:
                no_mas_intentos = True

        # Obtener la ruta de las imágenes
        image_path = '/static/images/'

        # Determinar si se debe mostrar la respuesta correcta
        show_correctness = 'never'
        if self.show_answer == 'when_attempts_run_out' and no_mas_intentos:
            show_correctness = 'always'
        elif self.show_answer == 'never':
            show_correctness = 'never'
        else:
            show_correctness = 'never'

        correct_order = []

        # Si se debe mostrar la respuesta correcta, usar la primera respuesta correcta
        if show_correctness == 'always' and  self.correct_answers:
            # Reordenar los elementos según la respuesta correcta
            correct_answer0 = []
            correct_answer0 = self.correct_answers.split('_[|]_')[0].split('_')
            for i, key in enumerate(correct_answer0):
                for element in elements:
                    if str(element['key']) == str(key):
                        correct_order.append({
                            'key': element['key'],
                            'content': element['content'],
                            'position': i + 1,
                            'zero_index': i,
                            'letter_upper': number_to_letter(i + 1, True),
                            'letter_lower': number_to_letter(i + 1, False),
                            'roman_upper': number_to_roman(i + 1, True),
                            'roman_lower': number_to_roman(i + 1, False)
                        })
                        break

        context = {
            'sublocation': str(self.location).split('@')[-1],
            'table_name': self.table_name,
            'background_color': self.background_color,
            'textcolumn_order': self.textcolumn_order,
            'textcolumn_content': self.textcolumn_content,
            'textcolumn_actions': self.textcolumn_actions,
            'numbering_type': self.numbering_type,
            'pretext_num': self.pretext_num,
            'postext_num': self.postext_num,
            'label_width': self.label_width,
            'use_custom_labels': self.use_custom_labels,
            'custom_labels': self.custom_labels,
            'uppercase_letters': self.uppercase_letters,
            'correct_answers': self.correct_answers,
            'random_disorder': self.random_disorder,
            'elements': ordered_elements,  # Usar los elementos reordenados
            'texto_intentos': texto_intentos,
            'no_mas_intentos': no_mas_intentos,
            'attempts': self.attempts,
            'max_attempts': self.max_attempts,
            'score': self.score,
            'image_path': image_path,
            'show_correctness': show_correctness,
            'correct_order': correct_order,
            'show_answer': self.show_answer,  # Agregar show_answer al contexto
            'indicator_class': 'correct' if self.score >= 1.0 else 'incorrect' if self.attempts > 0 else 'unanswered'
        }
        
        html = loader.render_template('static/html/ordertable.html', context)
        frag = self.build_fragment(
            html,
            self._get_js_init(),
            ['static/css/ordertable.css'],
            ['static/js/ordertable.js']
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
            'display_name': {
                'value': self.display_name,
                'display_name': self.fields['display_name'].display_name,
                'help': self.fields['display_name'].help
            },
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
            'pretext_num': {
                'value': self.pretext_num,
                'display_name': self.fields['pretext_num'].display_name,
                'help': self.fields['pretext_num'].help
            },
            'postext_num': {
                'value': self.postext_num,
                'display_name': self.fields['postext_num'].display_name,
                'help': self.fields['postext_num'].help
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
            },
            'show_answer': {
                'value': self.show_answer,
                'display_name': self.fields['show_answer'].display_name,
                'help': self.fields['show_answer'].help
            },
            'weight': {
                'value': self.weight,
                'display_name': self.fields['weight'].display_name,
                'help': self.fields['weight'].help
            },
            'max_attempts': {
                'value': self.max_attempts,
                'display_name': self.fields['max_attempts'].display_name,
                'help': self.fields['max_attempts'].help
            },
            'textcolumn_order': {
                'value': self.textcolumn_order,
                'display_name': self.fields['textcolumn_order'].display_name,
                'help': self.fields['textcolumn_order'].help
            },
            'textcolumn_content': {
                'value': self.textcolumn_content,
                'display_name': self.fields['textcolumn_content'].display_name,
                'help': self.fields['textcolumn_content'].help
            },
            'textcolumn_actions': {
                'value': self.textcolumn_actions,
                'display_name': self.fields['textcolumn_actions'].display_name,
                'help': self.fields['textcolumn_actions'].help
            },
            'label_width': {
                'value': self.label_width,
                'display_name': self.fields['label_width'].display_name,
                'help': self.fields['label_width'].help
            },
            'use_custom_labels': {
                'value': self.use_custom_labels,
                'display_name': self.fields['use_custom_labels'].display_name,
                'help': self.fields['use_custom_labels'].help
            },
            'custom_labels': {
                'value': self.custom_labels,
                'display_name': self.fields['custom_labels'].display_name,
                'help': self.fields['custom_labels'].help
            },
            'text_before_answer': {
                'value': self.text_before_answer,
                'display_name': self.fields['text_before_answer'].display_name,
                'help': self.fields['text_before_answer'].help
            }
        }
        
        html = loader.render_template('static/html/ordertable_studio.html', context)
        frag = self.build_fragment(
            html,
            self._get_js_init(),
            ['static/css/ordertable_studio.css'],
            ['static/js/drag-and-drop.js', 'static/js/ordertable_studio.js']
        )
        
        # Add the JavaScript file directly to the fragment
        frag.add_javascript(self.resource_string('static/js/drag-and-drop.js'))
        
        # Add the disordered order as a data attribute
        frag.add_javascript("""
            $(function() {
                $('.cmmorder-studio').data('disordered-order', '%s');
            });
        """ % self.disordered_order)
        
        return frag

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Handle studio submissions.
        """
        try:
            print("[CMMEDU-ORDERTABLE] Received data in studio_submit:", data)
            
            self.display_name = data.get('display_name', self.display_name)
            self.table_name = data.get('table_name', self.table_name)
            self.background_color = data.get('background_color', self.background_color)
            self.numbering_type = data.get('numbering_type', self.numbering_type)
            self.uppercase_letters = data.get('uppercase_letters', self.uppercase_letters)
            self.random_disorder = data.get('random_disorder', self.random_disorder)
            self.show_answer = data.get('show_answer', self.show_answer)
            self.pretext_num = data.get('pretext_num', self.pretext_num)
            self.postext_num = data.get('postext_num', self.postext_num)
            self.textcolumn_order = data.get('textcolumn_order', self.textcolumn_order)
            self.textcolumn_content = data.get('textcolumn_content', self.textcolumn_content)
            self.textcolumn_actions = data.get('textcolumn_actions', self.textcolumn_actions)
            self.label_width = data.get('label_width', self.label_width)
            self.use_custom_labels = data.get('use_custom_labels', self.use_custom_labels)
            self.text_before_answer = data.get('text_before_answer', self.text_before_answer)

            print("[CMMEDU-ORDERTABLE] use_custom_labels:", self.use_custom_labels)
            print("[CMMEDU-ORDERTABLE] custom_labels received:", data.get('custom_labels'))
            
            if self.use_custom_labels:
                custom_labels = data.get('custom_labels', {})
                if isinstance(custom_labels, dict):
                    self.custom_labels = custom_labels
                    print("[CMMEDU-ORDERTABLE] custom_labels saved:", self.custom_labels)
                else:
                    print("[CMMEDU-ORDERTABLE] Warning: custom_labels is not a dict:", type(custom_labels))
            else:
                self.custom_labels = {}
                print("[CMMEDU-ORDERTABLE] custom_labels reset to empty dict")
            
            # Manejar los elementos a ordenar
            items = data.get('items', [])
            if items:
                # Convertir la lista de items en un diccionario de ordeingelements
                self.ordeingelements = {
                    str(i+1): {'content': item} for i, item in enumerate(items)
                }
            else:
                # Si no hay items, usar ordeingelements si está presente
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
            
            # Guardar el peso
            if data.get('weight') and int(data.get('weight')) >= 0:
                self.weight = int(data.get('weight'))
            
            # Guardar el número de intentos
            if data.get('max_attempts') and int(data.get('max_attempts')) >= 0:
                self.max_attempts = int(data.get('max_attempts'))
            
            # Actualizar el atributo de datos para el frontend
            self.runtime.publish(self, 'edx.xblock.studio_submit', {
                'disordered_order': self.disordered_order,
                'correct_answers': self.correct_answers,
                'weight': self.weight,
                'max_attempts': self.max_attempts,
                'show_answer': self.show_answer,
                'label_width': self.label_width,
                'use_custom_labels': self.use_custom_labels,
                'custom_labels': self.custom_labels,
                'text_before_answer': self.text_before_answer
            })
            
            return {
                'result': 'success',
                'disordered_order': self.disordered_order,
                'correct_answers': self.correct_answers,
                'weight': self.weight,
                'max_attempts': self.max_attempts,
                'show_answer': self.show_answer,
                'label_width': self.label_width,
                'use_custom_labels': self.use_custom_labels,
                'custom_labels': self.custom_labels,
                'text_before_answer': self.text_before_answer
            }
        except Exception as e:
            print("[CMMEDU-ORDERTABLE] Error saving data:", str(e))
            print("[CMMEDU-ORDERTABLE] Error type:", type(e))
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
        Save the answer submitted by the student.
        """
        if self.attempts >= self.max_attempts:
            return {
                'result': 'error',
                'message': 'No hay más intentos disponibles'
            }

        # Get the answer - accept both 'order' and 'answer' parameters
        answer = data.get('order', data.get('answer', None))
        print("[CMMEDU-ORDERTABLE] Received answer:", answer)
        print("[CMMEDU-ORDERTABLE] Data received:", data)
        
        if not answer:
            return {
                'result': 'error',
                'message': 'No se ha enviado una respuesta'
            }

        # Validate answer format (should be numbers separated by underscores)
        if not all(part.isdigit() for part in answer.split('_')):
            return {
                'result': 'error',
                'message': 'Formato de respuesta inválido'
            }

        # Save the answer
        self.user_answer = answer
        print("[CMMEDU-ORDERTABLE] Saved user answer:", self.user_answer)

        # Check if the answer is correct
        correct_answers = self.get_correct_answers_list()
        print("[CMMEDU-ORDERTABLE] Correct answers list:", correct_answers)
        print("[CMMEDU-ORDERTABLE] Current correct_answers string:", self.correct_answers)
        
        # Convert answer to list format for comparison
        answer_list = answer.split('_')
        print("[CMMEDU-ORDERTABLE] Answer as list:", answer_list)
        
        # Check if answer matches any of the correct answers
        is_correct = answer_list in correct_answers
        print("[CMMEDU-ORDERTABLE] Is correct?", is_correct)
        print("[CMMEDU-ORDERTABLE] Comparison result:", {
            'user_answer': answer_list,
            'correct_answers': correct_answers,
            'is_match': is_correct
        })
        
        # Update the score
        self.score = 1.0 if is_correct else 0.0
        self.attempts += 1
        print("[CMMEDU-ORDERTABLE] Updated score:", self.score)
        print("[CMMEDU-ORDERTABLE] Updated attempts:", self.attempts)
        
        # Calculate weighted score
        weighted_score = float(self.weight) * self.score
        
        try:
            # Publish grade event
            self.runtime.publish(self, 'grade', {
                'value': weighted_score,
                'max_value': self.weight
            })
            
            print("[CMMEDU-ORDERTABLE] Published grade event")
            
        except Exception as e:
            print("[CMMEDU-ORDERTABLE] Error publishing events:", str(e))

        return {
            'result': 'success',
            'is_correct': is_correct,
            'score': self.score,
            'attempts': self.attempts,
            'max_attempts': self.max_attempts,
            'show_correctness': getattr(self, 'show_correctness', 'always'),
            'show_answer': self.show_answer,
            'user_answer': self.user_answer,
            'indicator_class': 'correct' if is_correct else 'incorrect'
        }

    @XBlock.json_handler
    def get_state(self, data, suffix=''):
        """
        Return the current state of the XBlock.
        """
        return {
            'score': self.score,
            'attempts': self.attempts,
            'max_attempts': self.max_attempts,
            'user_answer': self.user_answer,
            'show_answer': self.show_answer
        }

    def _get_js_init(self):
        """
        Get the JS initialization function.
        """
        return "CmmOrderXBlock"

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

    def max_score(self):
        """
        Return the maximum score possible.
        """
        return self.weight if self.has_score else None

    def get_progress(self):
        """
        Returns a statement of progress for the XBlock, which depends
        on the user's current score
        """
        if self.weight == 0:
            result = '0 puntos posibles'
        elif self.attempts <= 0:
            if self.weight == 1:
                result = "1 punto posible"
            else:
                result = str(self.weight) + " puntos posibles"
        else:
            scaled_score = self.score * self.weight
            # No trailing zero and no scientific notation
            score_string = ('%.15f' % scaled_score).rstrip('0').rstrip('.')
            if self.weight == 1:
                result = str(score_string) + "/" + str(self.weight) + " punto"
            else:
                result = str(score_string) + "/" + str(self.weight) + " puntos"
        return result

    def get_completion_status(self):
        """
        Returns the completion status of the XBlock
        """
        if self.attempts > 0:
            return {
                'completion': self.score,
                'complete': self.score >= 1.0
            }
        return {
            'completion': 0.0,
            'complete': False
        }

    def get_numbering(self, index):
        """
        Obtiene la numeración según el tipo seleccionado y el índice.
        Args:
            index (int): Índice base cero del elemento
        Returns:
            str: Numeración formateada con pre y post texto
        """
        number = index + 1  # Convertir de base 0 a base 1
        result = ""

        if self.numbering_type == "numbers":
            result = str(number)
        elif self.numbering_type == "numbers_zero":
            result = str(index)  # Usar el índice base 0 directamente
        elif self.numbering_type == "letters":
            result = number_to_letter(number, self.uppercase_letters)
        elif self.numbering_type == "roman":
            result = number_to_roman(number, self.uppercase_letters)
        elif self.numbering_type == "none":
            return ""

        return f"{self.pretext_num}{result}{self.postext_num}"

    def student_view_data(self, context=None):
        """
        Return a JSON representation of the student_view data.
        """
        return {
            'display_name': self.display_name,
            'table_name': self.table_name,
            'textcolumn_order': self.textcolumn_order,
            'textcolumn_content': self.textcolumn_content,
            'textcolumn_actions': self.textcolumn_actions,
            'background_color': self.background_color,
            'numbering_type': self.numbering_type,
            'pretext_num': self.pretext_num,
            'postext_num': self.postext_num,
            'uppercase_letters': self.uppercase_letters,
            'ordeingelements': self.ordeingelements,
            'correct_answers': self.correct_answers,
            'disordered_order': self.disordered_order,
            'random_disorder': self.random_disorder,
            'show_answer': self.show_answer,
            'weight': self.weight,
            'max_attempts': self.max_attempts,
            'attempts': self.attempts,
            'score': self.score,
            'user_answer': self.user_answer,
            'label_width': self.label_width,
            'use_custom_labels': self.use_custom_labels,
            'custom_labels': self.custom_labels
        } 