"""
Tests for CmmOrderXBlock
"""
import json
import unittest
from mock import MagicMock, Mock
from opaque_keys.edx.locations import SlashSeparatedCourseKey
from xblock.field_data import DictFieldData
from .cmmorder import CmmOrderXBlock


class TestRequest(object):
    """
    Module helper for @json_handler
    """
    method = None
    body = None
    success = None


class TestCmmOrderXBlock(unittest.TestCase):
    """
    A complete suite of unit tests for the CmmOrder XBlock
    """

    @classmethod
    def make_an_xblock(cls, **kw):
        """
        Helper method that creates a CmmOrder XBlock
        """
        course_id = SlashSeparatedCourseKey('foo', 'bar', 'baz')
        runtime = Mock(
            course_id=course_id,
            service=Mock(
                return_value=Mock(_catalog={}),
            ),
        )
        scope_ids = Mock()
        field_data = DictFieldData(kw)
        xblock = CmmOrderXBlock(runtime, field_data, scope_ids)
        xblock.xmodule_runtime = runtime
        return xblock

    def setUp(self):
        """
        Creates an xblock
        """
        self.xblock = TestCmmOrderXBlock.make_an_xblock()

    def test_validate_field_data(self):
        """
        Verifica que el xblock se crea correctamente con los valores por defecto
        """
        self.assertEqual(self.xblock.display_name, "Cmm Order Table XBlock")
        self.assertEqual(self.xblock.table_name, "Tabla Ordenada")
        self.assertEqual(self.xblock.textcolumn_order, "Orden")
        self.assertEqual(self.xblock.textcolumn_content, "Elementos a ordenar")
        self.assertEqual(self.xblock.textcolumn_actions, "Acciones")
        self.assertEqual(self.xblock.background_color, "#ececec")
        self.assertEqual(self.xblock.numbering_type, "numbers")
        self.assertEqual(self.xblock.attempts, 0)
        self.assertEqual(self.xblock.score, 0.0)
        self.assertEqual(self.xblock.user_answer, "")

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