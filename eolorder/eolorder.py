"""
EOL Order XBlock implementation
"""
import json
import pkg_resources
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Scope, String, List, Boolean
from xblockutils.studio_editable import StudioEditableXBlockMixin


class EolOrderXBlock(StudioEditableXBlockMixin, XBlock):
    """
    XBlock for ordering items
    """
    display_name = String(
        display_name="Display Name",
        help="This name appears in the horizontal navigation at the top of the page.",
        scope=Scope.settings,
        default="Order Items"
    )

    items = List(
        display_name="Items",
        help="List of items to be ordered",
        scope=Scope.content,
        default=[]
    )

    editable_fields = ('display_name', 'items')

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def studio_view(self, context=None):
        """
        The studio view of the EolOrderXBlock, shown to course authors
        when editing the block.
        """
        html = self.resource_string("static/html/eolorder_studio.html")
        frag = Fragment(html.format(
            display_name=self.display_name,
            items=self.items
        ))
        frag.add_css(self.resource_string("static/css/eolorder.css"))
        frag.add_javascript(self.resource_string("static/js/src/eolorder.js"))
        frag.initialize_js('EolOrderXBlockEdit')
        return frag

    def student_view(self, context=None):
        """
        The primary view of the EolOrderXBlock, shown to students
        when viewing courses.
        """
        html = self.resource_string("static/html/eolorder.html")
        frag = Fragment(html.format(
            display_name=self.display_name,
            items=self.items
        ))
        frag.add_css(self.resource_string("static/css/eolorder.css"))
        frag.add_javascript(self.resource_string("static/js/src/eolorder.js"))
        frag.initialize_js('EolOrderXBlock')
        return frag

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Handle studio submissions
        """
        self.display_name = data.get('display_name', self.display_name)
        self.items = data.get('items', self.items)
        return {'result': 'success'}

    @XBlock.json_handler
    def submit_answer(self, data, suffix=''):
        """
        Handle student submissions
        """
        # Implement your submission logic here
        return {'result': 'success'} 