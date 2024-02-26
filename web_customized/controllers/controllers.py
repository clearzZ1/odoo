# -*- coding: utf-8 -*-
# from odoo import http


# class WebCustomized(http.Controller):
#     @http.route('/web_customized/web_customized', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/web_customized/web_customized/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('web_customized.listing', {
#             'root': '/web_customized/web_customized',
#             'objects': http.request.env['web_customized.web_customized'].search([]),
#         })

#     @http.route('/web_customized/web_customized/objects/<model("web_customized.web_customized"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('web_customized.object', {
#             'object': obj
#         })

