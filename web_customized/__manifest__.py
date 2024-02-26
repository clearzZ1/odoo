# -*- coding: utf-8 -*-
{
    "name": "Web Customized",
    "summary": "Column search & advanced search...",
    "version": "17.0.0.1",
    "category": "customized/customized",
    "website": "https://github.com/clearzZ1/odoo",
    "author": "clearzZ",
    "license": "LGPL-3",
    "depends": ["base", "web"],
    "sequence": 1,
    "installable": True,
    "application": True,
    "auto_install": False,
    'data': [
        # 'security/ir.model.access.csv',
        # 'views/views.xml',
        # 'views/templates.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'web_customized/static/src/css/*',
            'web_customized/static/src/xml/*',
            'web_customized/static/src/js/datetime_range.js',
            'web_customized/static/src/js/list_renderer.js',
        ]
    },
    'images': ['static/img/datetime.png'],
}

