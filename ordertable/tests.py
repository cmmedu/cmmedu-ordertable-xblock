"""
Tests for CmmOrderXBlock
"""
import json
import unittest
from mock import MagicMock, Mock
from opaque_keys.edx.locator import CourseLocator
from xblock.field_data import DictFieldData
from .ordertable import CmmEduOrderTableXBlock


class TestRequest(object):
    """
    Module helper for @json_handler
    """
    method = None
    body = None
    success = None


class TestCmmEduOrderTableXBlock(unittest.TestCase):
    """
    A complete suite of unit tests for the CmmEduOrderTable XBlock
    """

    @classmethod
    def make_an_xblock(cls, **kw):
        """
        Helper method that creates a CmmEduOrderTable XBlock
        """
        course_id = CourseLocator('foo', 'bar', 'baz')
        runtime = Mock(
            course_id=course_id,
            service=Mock(
                return_value=Mock(_catalog={}),
            ),
            local_resource_url=Mock(
                side_effect=lambda _self, path: '/static-resource/' + path
            ),
        )
        scope_ids = Mock()
        field_data = DictFieldData(kw)
        xblock = CmmEduOrderTableXBlock(runtime, field_data, scope_ids)
        xblock.xmodule_runtime = runtime
        xblock.location = course_id
        return xblock

    def setUp(self):
        """
        Creates an xblock
        """
        self.xblock = TestCmmEduOrderTableXBlock.make_an_xblock()

    def test_validate_field_data(self):
        """
        Verifica que el xblock se crea correctamente con los valores por defecto
        """
        self.assertEqual(self.xblock.display_name, "CmmEdu Order Table XBlock")
        self.assertEqual(self.xblock.table_name, "Tabla Ordenada")
        self.assertEqual(self.xblock.textcolumn_order, "Orden")
        self.assertEqual(self.xblock.textcolumn_content, "Elementos a ordenar")
        self.assertEqual(self.xblock.textcolumn_actions, "Acciones")
        self.assertEqual(self.xblock.background_color, "#ececec")
        self.assertEqual(self.xblock.numbering_type, "numbers")
        self.assertEqual(self.xblock.attempts, 0)
        self.assertEqual(self.xblock.score, 0.0)
        self.assertEqual(self.xblock.user_answer, "")
        self.assertEqual(self.xblock.pretext_num, "")
        self.assertEqual(self.xblock.postext_num, "")
        self.assertEqual(self.xblock.uppercase_letters, False)

    def test_submit_answer_correct(self):
        """
        Prueba el envío de una respuesta correcta
        """
        # Configurar respuestas correctas
        self.xblock.correct_answers = "1_2"
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        
        # Simular respuesta correcta
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({'order': '1_2', 'answer': '1_2'})
        request.body = data.encode('utf-8')
        
        response = self.xblock.submit_answer(request)
        response_data = response.json_body
        
        self.assertEqual(response_data['result'], 'success')
        self.assertEqual(response_data['is_correct'], True)
        self.assertEqual(response_data['score'], 1.0)
        self.assertEqual(response_data['attempts'], 1)
        self.assertEqual(response_data['max_attempts'], self.xblock.max_attempts)
        self.assertEqual(self.xblock.user_answer, '1_2')

    def test_submit_answer_incorrect(self):
        """
        Prueba el envío de una respuesta incorrecta
        """
        # Configurar respuestas correctas
        self.xblock.correct_answers = "1_2"
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        
        # Simular respuesta incorrecta
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({'order': '2_1', 'answer': '2_1'})
        request.body = data.encode('utf-8')
        
        response = self.xblock.submit_answer(request)
        response_data = response.json_body
        
        self.assertEqual(response_data['result'], 'success')
        self.assertEqual(response_data['is_correct'], False)
        self.assertEqual(response_data['score'], 0.0)
        self.assertEqual(response_data['attempts'], 1)
        self.assertEqual(response_data['max_attempts'], self.xblock.max_attempts)
        self.assertEqual(self.xblock.user_answer, '2_1')

    def test_submit_answer_multiple_correct_answers(self):
        """
        Prueba el envío de una respuesta cuando hay múltiples respuestas correctas
        """
        # Configurar múltiples respuestas correctas
        self.xblock.correct_answers = "1_2_[|]_2_1"
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        
        # Probar primera respuesta correcta
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({'order': '1_2', 'answer': '1_2'})
        request.body = data.encode('utf-8')
        
        response = self.xblock.submit_answer(request)
        self.assertEqual(response.json_body['is_correct'], True)
        self.assertEqual(response.json_body['score'], 1.0)
        
        # Resetear el XBlock
        self.xblock.attempts = 0
        self.xblock.score = 0.0
        self.xblock.user_answer = ""
        
        # Probar segunda respuesta correcta
        data = json.dumps({'order': '2_1', 'answer': '2_1'})
        request.body = data.encode('utf-8')
        
        response = self.xblock.submit_answer(request)
        self.assertEqual(response.json_body['is_correct'], True)
        self.assertEqual(response.json_body['score'], 1.0)

    def test_max_attempts(self):
        """
        Prueba el límite de intentos
        """
        self.xblock.max_attempts = 2
        self.xblock.attempts = 0
        request = TestRequest()
        request.method = 'POST'
        
        # Primer intento
        data = json.dumps({'order': '1_2', 'answer': '1_2'})
        request.body = data.encode('utf-8')
        response = self.xblock.submit_answer(request)
        self.assertEqual(self.xblock.attempts, 1)
        
        # Segundo intento
        response = self.xblock.submit_answer(request)
        self.assertEqual(self.xblock.attempts, 2)
        
        # Tercer intento (debería fallar)
        response = self.xblock.submit_answer(request)
        self.assertEqual(response.json_body['result'], 'error')
        self.assertEqual(response.json_body['message'], 'No hay más intentos disponibles')

    def test_get_state(self):
        """
        Prueba la obtención del estado actual del XBlock
        """
        # Configurar un estado
        self.xblock.score = 0.5
        self.xblock.attempts = 2
        self.xblock.max_attempts = 3
        self.xblock.user_answer = "1_2"
        self.xblock.show_answer = "when_attempts_run_out"
        
        request = TestRequest()
        request.method = 'POST'
        request.body = b'{}'
        
        response = self.xblock.get_state(request)
        response_data = response.json_body
        
        self.assertEqual(response_data['score'], 0.5)
        self.assertEqual(response_data['attempts'], 2)
        self.assertEqual(response_data['max_attempts'], 3)
        self.assertEqual(response_data['user_answer'], "1_2")
        self.assertEqual(response_data['show_answer'], "when_attempts_run_out")

    def test_add_row(self):
        """
        Prueba la adición de una nueva fila
        """
        initial_length = len(self.xblock.ordeingelements)
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({})
        request.body = data.encode('utf-8')
        
        response = self.xblock.add_row(request)
        self.assertEqual(len(self.xblock.ordeingelements), initial_length + 1)
        self.assertEqual(response.json_body['result'], 'success')

    def test_max_score(self):
        """
        Prueba el cálculo de la puntuación máxima
        """
        self.xblock.weight = 2
        self.assertEqual(self.xblock.max_score(), 2.0)

    def test_invalid_answer_format(self):
        """
        Prueba el envío de una respuesta con formato inválido
        """
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({'order': 'invalid_format', 'answer': 'invalid_format'})
        request.body = data.encode('utf-8')
        
        response = self.xblock.submit_answer(request)
        self.assertEqual(response.json_body['result'], 'error')

    def test_empty_answer(self):
        """
        Prueba el envío de una respuesta vacía
        """
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({'order': '', 'answer': ''})
        request.body = data.encode('utf-8')
        
        response = self.xblock.submit_answer(request)
        self.assertEqual(response.json_body['result'], 'error')

    def test_special_characters(self):
        """
        Prueba el manejo de caracteres especiales en las respuestas
        """
        self.xblock.ordeingelements = {
            1: {'content': 'paso con ñ'},
            2: {'content': 'paso con á'}
        }
        self.xblock.correct_answers = "1_2"
        
        request = TestRequest()
        request.method = 'POST'
        data = json.dumps({'order': '1_2', 'answer': '1_2'})
        request.body = data.encode('utf-8')
        
        response = self.xblock.submit_answer(request)
        self.assertEqual(response.json_body['result'], 'success')

    def test_numbering_types(self):
        """
        Prueba los diferentes tipos de numeración
        """
        # Probar números
        self.xblock.numbering_type = "numbers"
        self.xblock.pretext_num = "("
        self.xblock.postext_num = ")"
        self.assertEqual(self.xblock.get_numbering(0), "(1)")
        
        # Probar números desde cero
        self.xblock.numbering_type = "numbers_zero"
        self.assertEqual(self.xblock.get_numbering(0), "(0)")
        
        # Probar letras minúsculas
        self.xblock.numbering_type = "letters"
        self.xblock.uppercase_letters = False
        self.assertEqual(self.xblock.get_numbering(0), "(a)")
        
        # Probar letras mayúsculas
        self.xblock.uppercase_letters = True
        self.assertEqual(self.xblock.get_numbering(0), "(A)")
        
        # Probar números romanos minúsculos
        self.xblock.numbering_type = "roman"
        self.xblock.uppercase_letters = False
        self.assertEqual(self.xblock.get_numbering(0), "(i)")
        
        # Probar números romanos mayúsculos
        self.xblock.uppercase_letters = True
        self.assertEqual(self.xblock.get_numbering(0), "(I)")

    def test_studio_submit(self):
        """
        Prueba el envío de datos desde el Studio
        """
        request = TestRequest()
        request.method = 'POST'
        data = {
            'display_name': 'Test Table',
            'table_name': 'Test Order',
            'textcolumn_order': 'Test Order',
            'textcolumn_content': 'Test Content',
            'textcolumn_actions': 'Test Actions',
            'background_color': '#ffffff',
            'numbering_type': 'letters',
            'pretext_num': '[',
            'postext_num': ']',
            'uppercase_letters': True,
            'weight': 10,
            'max_attempts': 5,
            'show_answer': 'always',
            'items': ['Item 1', 'Item 2']
        }
        request.body = json.dumps(data).encode('utf-8')
        
        response = self.xblock.studio_submit(request)
        self.assertEqual(response.json_body['result'], 'success')
        self.assertEqual(self.xblock.display_name, 'Test Table')
        self.assertEqual(self.xblock.table_name, 'Test Order')
        self.assertEqual(self.xblock.numbering_type, 'letters')
        self.assertEqual(self.xblock.max_attempts, 5)
        self.assertEqual(len(self.xblock.ordeingelements), 2)

    def test_student_view_data(self):
        """
        Prueba la vista de datos del estudiante
        """
        self.xblock.ordeingelements = {
            1: {'content': 'Item 1'},
            2: {'content': 'Item 2'}
        }
        self.xblock.score = 0.5
        self.xblock.attempts = 2
        self.xblock.max_attempts = 3
        self.xblock.user_answer = "1_2"
        self.xblock.show_answer = "when_attempts_run_out"
        self.xblock.display_name = "Test Table"
        self.xblock.table_name = "Test Order"
        self.xblock.textcolumn_order = "Test Order"
        self.xblock.textcolumn_content = "Test Content"
        self.xblock.textcolumn_actions = "Test Actions"
        self.xblock.background_color = "#ffffff"
        self.xblock.numbering_type = "letters"
        self.xblock.pretext_num = "["
        self.xblock.postext_num = "]"
        self.xblock.uppercase_letters = True
        self.xblock.weight = 10
        self.xblock.correct_answers = "1_2"
        self.xblock.disordered_order = "2_1"
        self.xblock.random_disorder = False

        data = self.xblock.student_view_data()
        
        # Verificar que todos los campos estén presentes y tengan los valores correctos
        self.assertEqual(data['display_name'], "Test Table")
        self.assertEqual(data['table_name'], "Test Order")
        self.assertEqual(data['textcolumn_order'], "Test Order")
        self.assertEqual(data['textcolumn_content'], "Test Content")
        self.assertEqual(data['textcolumn_actions'], "Test Actions")
        self.assertEqual(data['background_color'], "#ffffff")
        self.assertEqual(data['numbering_type'], "letters")
        self.assertEqual(data['pretext_num'], "[")
        self.assertEqual(data['postext_num'], "]")
        self.assertEqual(data['uppercase_letters'], True)
        self.assertEqual(data['ordeingelements'], {1: {'content': 'Item 1'}, 2: {'content': 'Item 2'}})
        self.assertEqual(data['correct_answers'], "1_2")
        self.assertEqual(data['disordered_order'], "2_1")
        self.assertEqual(data['random_disorder'], False)
        self.assertEqual(data['show_answer'], "when_attempts_run_out")
        self.assertEqual(data['weight'], 10)
        self.assertEqual(data['max_attempts'], 3)
        self.assertEqual(data['attempts'], 2)
        self.assertEqual(data['score'], 0.5)
        self.assertEqual(data['user_answer'], "1_2")

    def test_student_view_default_order(self):
        """
        Sin intentos y sin desorden configurado: se muestra el orden original.
        """
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        self.xblock.attempts = 0
        self.xblock.random_disorder = False
        self.xblock.disordered_order = ""
        frag = self.xblock.student_view()
        self.assertIn('paso 1', frag.content)

    def test_student_view_random_disorder(self):
        """
        Sin intentos y con random_disorder activo: se genera un orden aleatorio.
        """
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        self.xblock.attempts = 0
        self.xblock.random_disorder = True
        frag = self.xblock.student_view()
        self.assertIn('paso 1', frag.content)

    def test_student_view_disordered_order(self):
        """
        Sin intentos y con un orden desordenado explícito configurado.
        """
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        self.xblock.attempts = 0
        self.xblock.random_disorder = False
        self.xblock.disordered_order = "2_1"
        frag = self.xblock.student_view()
        self.assertIn('paso 2', frag.content)

    def test_student_view_with_saved_user_answer(self):
        """
        Con intentos y una respuesta guardada del usuario: se muestra esa respuesta.
        """
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        self.xblock.attempts = 1
        self.xblock.user_answer = "2_1"
        frag = self.xblock.student_view()
        self.assertIn('paso 1', frag.content)

    def test_student_view_correct_without_saved_answer(self):
        """
        Con intentos, puntaje correcto pero sin respuesta guardada: se usa la
        primera respuesta correcta como respaldo.
        """
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        self.xblock.attempts = 1
        self.xblock.user_answer = ""
        self.xblock.score = 1.0
        self.xblock.correct_answers = "2_1"
        frag = self.xblock.student_view()
        self.assertIn('paso 2', frag.content)

    def test_student_view_shows_answer_when_attempts_run_out(self):
        """
        Cuando se agotan los intentos y show_answer lo permite, se calcula el
        orden correcto para mostrarlo.
        """
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        self.xblock.max_attempts = 1
        self.xblock.attempts = 1
        self.xblock.user_answer = "1_2"
        self.xblock.correct_answers = "1_2"
        self.xblock.show_answer = "when_attempts_run_out"
        frag = self.xblock.student_view()
        self.assertIn('paso 1', frag.content)

    def test_student_view_never_shows_answer(self):
        """
        show_answer='never' nunca calcula ni muestra el orden correcto.
        """
        self.xblock.max_attempts = 1
        self.xblock.attempts = 1
        self.xblock.show_answer = "never"
        frag = self.xblock.student_view()
        self.assertIsNotNone(frag.content)

    def test_studio_view_generates_defaults(self):
        """
        studio_view genera disordered_order y correct_answers cuando están vacíos.
        """
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        self.xblock.disordered_order = ""
        self.xblock.correct_answers = ""
        frag = self.xblock.studio_view()
        self.assertEqual(self.xblock.disordered_order, "1_2")
        self.assertEqual(self.xblock.correct_answers, "1_2")
        self.assertIn('id="table_name"', frag.content)

    def test_studio_view_normalizes_list_disordered_order(self):
        """
        Si disordered_order llega como lista, studio_view lo convierte a string.
        """
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        self.xblock.disordered_order = ['2', '1']
        self.xblock.studio_view()
        self.assertEqual(self.xblock.disordered_order, "2_1")

    def test_studio_submit_custom_labels_valid(self):
        """
        Con use_custom_labels activo y un dict válido, se guardan las etiquetas.
        """
        self.xblock.use_custom_labels = True
        request = TestRequest()
        request.method = 'POST'
        data = {'use_custom_labels': True, 'custom_labels': {'1': {'content': 'Uno'}}}
        request.body = json.dumps(data).encode('utf-8')
        response = self.xblock.studio_submit(request)
        self.assertEqual(response.json_body['result'], 'success')
        self.assertEqual(self.xblock.custom_labels, {'1': {'content': 'Uno'}})

    def test_studio_submit_custom_labels_invalid_type(self):
        """
        Con use_custom_labels activo pero custom_labels no es dict: se ignora.
        """
        self.xblock.use_custom_labels = True
        self.xblock.custom_labels = {'1': {'content': 'previo'}}
        request = TestRequest()
        request.method = 'POST'
        data = {'use_custom_labels': True, 'custom_labels': 'not-a-dict'}
        request.body = json.dumps(data).encode('utf-8')
        response = self.xblock.studio_submit(request)
        self.assertEqual(response.json_body['result'], 'success')
        self.assertEqual(self.xblock.custom_labels, {'1': {'content': 'previo'}})

    def test_studio_submit_custom_labels_disabled(self):
        """
        Con use_custom_labels desactivado, custom_labels se resetea a vacío.
        """
        self.xblock.use_custom_labels = False
        self.xblock.custom_labels = {'1': {'content': 'previo'}}
        request = TestRequest()
        request.method = 'POST'
        request.body = json.dumps({'use_custom_labels': False}).encode('utf-8')
        self.xblock.studio_submit(request)
        self.assertEqual(self.xblock.custom_labels, {})

    def test_studio_submit_ordeingelements_without_items(self):
        """
        Sin 'items' en el payload, se usa 'ordeingelements' si es un dict.
        """
        request = TestRequest()
        request.method = 'POST'
        data = {'ordeingelements': {'1': {'content': 'Solo uno'}}}
        request.body = json.dumps(data).encode('utf-8')
        self.xblock.studio_submit(request)
        self.assertEqual(self.xblock.ordeingelements, {'1': {'content': 'Solo uno'}})

    def test_studio_submit_disordered_order_needs_stripping(self):
        """
        Un disordered_order con guiones bajos al inicio/final se limpia.
        """
        request = TestRequest()
        request.method = 'POST'
        data = {'items': ['a', 'b'], 'disordered_order': '_1_2_'}
        request.body = json.dumps(data).encode('utf-8')
        self.xblock.studio_submit(request)
        self.assertEqual(self.xblock.disordered_order, "1_2")

    def test_studio_submit_disordered_order_as_list(self):
        """
        Un disordered_order enviado como lista se convierte a string.
        """
        request = TestRequest()
        request.method = 'POST'
        data = {'items': ['a', 'b'], 'disordered_order': ['2', '1']}
        request.body = json.dumps(data).encode('utf-8')
        self.xblock.studio_submit(request)
        self.assertEqual(self.xblock.disordered_order, "2_1")

    def test_studio_submit_correct_answers_with_multiple_lists(self):
        """
        Un correct_answers que ya trae el separador '_[|]_' se guarda tal cual.
        """
        request = TestRequest()
        request.method = 'POST'
        data = {'items': ['a', 'b'], 'correct_answers': '1_2_[|]_2_1'}
        request.body = json.dumps(data).encode('utf-8')
        self.xblock.studio_submit(request)
        self.assertEqual(self.xblock.correct_answers, "1_2_[|]_2_1")

    def test_studio_submit_correct_answers_not_string(self):
        """
        Si correct_answers no es string, se genera un orden por defecto.
        """
        request = TestRequest()
        request.method = 'POST'
        data = {'items': ['a', 'b'], 'correct_answers': 123}
        request.body = json.dumps(data).encode('utf-8')
        self.xblock.studio_submit(request)
        self.assertEqual(self.xblock.correct_answers, "1_2")

    def test_studio_submit_handles_exceptions(self):
        """
        Un valor de weight inválido provoca una excepción capturada internamente.
        """
        request = TestRequest()
        request.method = 'POST'
        data = {'weight': 'not-a-number'}
        request.body = json.dumps(data).encode('utf-8')
        response = self.xblock.studio_submit(request)
        self.assertEqual(response.json_body['result'], 'error')
        self.assertIn('message', response.json_body)

    def test_submit_answer_publish_failure_is_swallowed(self):
        """
        Si runtime.publish falla, submit_answer igual retorna éxito.
        """
        self.xblock.correct_answers = "1_2"
        self.xblock.ordeingelements = {1: {'content': 'paso 1'}, 2: {'content': 'paso 2'}}
        self.xblock.runtime.publish = Mock(side_effect=Exception('boom'))
        request = TestRequest()
        request.method = 'POST'
        request.body = json.dumps({'order': '1_2'}).encode('utf-8')
        response = self.xblock.submit_answer(request)
        self.assertEqual(response.json_body['result'], 'success')

    def test_get_correct_answers_list_empty(self):
        """
        Sin correct_answers configurado, se retorna una lista vacía.
        """
        self.xblock.correct_answers = ""
        self.assertEqual(self.xblock.get_correct_answers_list(), [])

    def test_set_correct_answers_list_empty(self):
        """
        Una lista vacía o None limpia correct_answers.
        """
        self.xblock.set_correct_answers_list([])
        self.assertEqual(self.xblock.correct_answers, "")

    def test_set_correct_answers_list_roundtrip(self):
        """
        set_correct_answers_list serializa múltiples listas de respuestas.
        """
        self.xblock.set_correct_answers_list([['1', '2'], ['2', '1']])
        self.assertEqual(self.xblock.correct_answers, "1_2_[|]_2_1")
        self.assertEqual(
            self.xblock.get_correct_answers_list(),
            [['1', '2'], ['2', '1']],
        )

    def test_get_progress_zero_weight(self):
        self.xblock.weight = 0
        self.assertIn('0 puntos posibles', self.xblock.get_progress())

    def test_get_progress_unattempted_single_point(self):
        self.xblock.weight = 1
        self.xblock.attempts = 0
        self.assertIn('1 punto posible', self.xblock.get_progress())

    def test_get_progress_unattempted_multiple_points(self):
        self.xblock.weight = 3
        self.xblock.attempts = 0
        self.assertIn('3 puntos posibles', self.xblock.get_progress())

    def test_get_progress_attempted_single_point(self):
        self.xblock.weight = 1
        self.xblock.attempts = 1
        self.xblock.score = 1.0
        self.assertIn('/1 punto', self.xblock.get_progress())

    def test_get_progress_attempted_multiple_points(self):
        self.xblock.weight = 2
        self.xblock.attempts = 1
        self.xblock.score = 1.0
        self.assertIn('/2 puntos', self.xblock.get_progress())

    def test_get_completion_status_complete(self):
        self.xblock.attempts = 1
        self.xblock.score = 1.0
        status = self.xblock.get_completion_status()
        self.assertEqual(status, {'completion': 1.0, 'complete': True})

    def test_get_completion_status_incomplete(self):
        self.xblock.attempts = 1
        self.xblock.score = 0.0
        status = self.xblock.get_completion_status()
        self.assertEqual(status, {'completion': 0.0, 'complete': False})

    def test_get_completion_status_unattempted(self):
        self.xblock.attempts = 0
        status = self.xblock.get_completion_status()
        self.assertEqual(status, {'completion': 0.0, 'complete': False})

    def test_get_numbering_none_type(self):
        self.xblock.numbering_type = "none"
        self.assertEqual(self.xblock.get_numbering(0), "")

    def test_get_js_init(self):
        self.assertEqual(self.xblock._get_js_init(), "CmmOrderXBlock") 