"""
Tests for EolOrderXBlock
"""
import unittest
from unittest.mock import Mock, patch
from xblock.test.scenario import XBlockScenario
from .eolorder import EolOrderXBlock


class TestEolOrderXBlock(unittest.TestCase):
    """
    Tests for EolOrderXBlock
    """
    def setUp(self):
        """
        Setup test environment
        """
        self.scenario = XBlockScenario(EolOrderXBlock)

    def test_student_view(self):
        """
        Test student view rendering
        """
        block = self.scenario.create_block()
        fragment = block.student_view()
        self.assertIsNotNone(fragment)
        self.assertIn('eolorder', fragment.body)

    def test_submit_answer(self):
        """
        Test answer submission
        """
        block = self.scenario.create_block()
        response = block.submit_answer({})
        self.assertEqual(response, {'result': 'success'}) 