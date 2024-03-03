/** @odoo-module **/

import {ListRenderer} from "@web/views/list/list_renderer";
import {patch} from "@web/core/utils/patch";
import {getActiveHotkey} from "@web/core/hotkeys/hotkey_service";
import {_t} from "@web/core/l10n/translation";
import {DateTimeRange} from "./datetime_range"

import {
    useState,
    onMounted,
    useRef,
} from "@odoo/owl";

patch(ListRenderer.prototype, {
    setup() {
        super.setup(...arguments);
        this.searchFilters = {};
        self = this;
        if (!this.isX2Many) {
            const _deactivateGroup = this.env.searchModel.deactivateGroup;
            this.env.searchModel.deactivateGroup = (groupId) => {
                const items = this.env.searchModel.searchItems;
                Object.keys(items).forEach(function (key) {
                    if (items[key].groupId === groupId && items[key].custom) {
                        const fieldInfo = self.fields[items[key].field];
                        if (fieldInfo) {
                            if (['selection', 'boolean'].includes(fieldInfo.type)) {
                                self.searchFilters[fieldInfo.name] = {
                                    value: 'all'
                                };
                            } else if (['date', 'datetime'].includes(fieldInfo.type)) {
                                self.searchFilters[fieldInfo.name] = [];
                            } else {
                                self.searchFilters[fieldInfo.name] = self.searchFilters[fieldInfo.name]
                                    .filter(item => item.groupId !== groupId);
                            }
                        }
                    }
                });
                _deactivateGroup.call(this.env.searchModel, groupId);
            };
            const fieldsList = Object.keys(this.fields);
            this.searchFilters = useState(fieldsList.reduce((obj, value) => {
                const fieldInfo = self.fields[value];
                if (fieldInfo.store) {
                    obj[value] = [];
                }
                return obj
            }, {}));
            this._checkSearchFilter();
        }
    },

    // The following code manipulates the DOM directly to avoid having to wait for a
    // render + patch which would occur on the next frame and cause flickering.
    freezeColumnWidths() {
        if (!this.keepColumnWidths) {
            this.columnWidths = null;
        }

        const table = this.tableRef.el;
        const headers = [...table.querySelector("thead tr").querySelectorAll("th:not(.o_list_actions_header)")];

        if (!this.columnWidths || !this.columnWidths.length) {
            // no column widths to restore

            table.style.tableLayout = "fixed";
            const allowedWidth = table.parentNode.getBoundingClientRect().width;
            // Set table layout auto and remove inline style to make sure that css
            // rules apply (e.g. fixed width of record selector)
            table.style.tableLayout = "auto";
            headers.forEach((th) => {
                th.style.width = null;
                th.style.maxWidth = null;
            });

            this.setDefaultColumnWidths();

            // Squeeze the table by applying a max-width on largest columns to
            // ensure that it doesn't overflow
            this.columnWidths = this.computeColumnWidthsFromContent(allowedWidth);
            table.style.tableLayout = "fixed";
        }
        headers.forEach((th, index) => {
            if (!th.style.width) {
                th.style.width = `${Math.floor(this.columnWidths[index])}px`;
            }
        });
    },

    computeColumnWidthsFromContent(allowedWidth) {
        const table = this.tableRef.el;

        // Toggle a className used to remove style that could interfere with the ideal width
        // computation algorithm (e.g. prevent text fields from being wrapped during the
        // computation, to prevent them from being completely crushed)
        table.classList.add("o_list_computing_widths");

        const headers = [...table.querySelector("thead tr").querySelectorAll("th")];
        const columnWidths = headers.map((th) => th.getBoundingClientRect().width);
        const getWidth = (th) => columnWidths[headers.indexOf(th)] || 0;
        const getTotalWidth = () => columnWidths.reduce((tot, width) => tot + width, 0);
        const shrinkColumns = (thsToShrink, shrinkAmount) => {
            let canKeepShrinking = true;
            for (const th of thsToShrink) {
                const index = headers.indexOf(th);
                let maxWidth = columnWidths[index] - shrinkAmount;
                // prevent the columns from shrinking under 92px (~ date field)
                if (maxWidth < 92) {
                    maxWidth = 92;
                    canKeepShrinking = false;
                }
                th.style.maxWidth = `${Math.floor(maxWidth)}px`;
                columnWidths[index] = maxWidth;
            }
            return canKeepShrinking;
        };
        // Sort columns, largest first
        const sortedThs = [...table.querySelector("thead tr").querySelectorAll("th:not(.o_list_button)")].sort(
            (a, b) => getWidth(b) - getWidth(a)
        );

        let totalWidth = getTotalWidth();
        for (let index = 1; totalWidth > allowedWidth; index++) {
            // Find the largest columns
            const largestCols = sortedThs.slice(0, index);
            const currentWidth = getWidth(largestCols[0]);
            for (; currentWidth === getWidth(sortedThs[index]); index++) {
                largestCols.push(sortedThs[index]);
            }

            // Compute the number of px to remove from the largest columns
            const nextLargest = sortedThs[index];
            const toRemove = Math.ceil((totalWidth - allowedWidth) / largestCols.length);
            const shrinkAmount = Math.min(toRemove, currentWidth - getWidth(nextLargest));

            // Shrink the largest columns
            const canKeepShrinking = shrinkColumns(largestCols, shrinkAmount);
            if (!canKeepShrinking) {
                break;
            }

            totalWidth = getTotalWidth();
        }

        // We are no longer computing widths, so restore the normal style
        table.classList.remove("o_list_computing_widths");
        return columnWidths;
    },

    _checkSearchFilter() {
        self = this;
        const searchModel = this.env.searchModel;
        searchModel.query.forEach(query => {
            const searchItem = searchModel.searchItems[query.searchItemId];
            if (searchItem.custom) {
                const fieldInfo = self.fields[searchItem.field];
                if (fieldInfo) {
                    if (['selection', 'boolean'].includes(fieldInfo.type)) {
                        self.searchFilters[fieldInfo.name] = {
                            groupId: searchItem.groupId,
                            value: searchItem.domain[0][2].toString()
                        }
                    } else if (['date', 'datetime'].includes(fieldInfo.type)) {
                        self.searchFilters[fieldInfo.name] = {
                            groupId: searchItem.groupId,
                            title: searchItem.title,
                            value: searchItem.title
                        }
                    } else {
                        self.searchFilters[fieldInfo.name].push({
                            groupId: searchItem.groupId,
                            value: searchItem.domain[0][2]
                        })
                    }
                }
            }
        })
    },

    onDateTimeApply(fieldInfo, dateTimeRange) {
        const option = this.searchFilters[fieldInfo.name];
        option.groupId && this.env.searchModel.deactivateGroup(option.groupId);
        const format = dateTimeRange.formatValue;
        this.searchFilters[fieldInfo.name] = {
            groupId: this.env.searchModel.nextGroupId,
            value: format,
            title: format[0][1] + '~' + format[1][1]
        }
        this.env.searchModel.createNewFilters([{
            description: `${fieldInfo.string}:${format[0][1]}~${format[1][1]}`,
            domain: [[fieldInfo.name, '>=', format[0][0]], [fieldInfo.name, '<=', format[1][0]]],
            field: fieldInfo.name,
            custom: true,
            title: format[0][1] + '~' + format[1][1]
        }])
    },

    _onInputKeydown(ev, field) {
        const hotkey = getActiveHotkey(ev);
        switch (hotkey) {
            case 'enter':
                this.createNewFilters(ev, field);
                break;
        }
    },

    createNewFilters(ev, fieldInfo) {
        let value = ev.target.value;

        let operator = 'ilike';

        if (!value) return;

        this.searchFilters[fieldInfo.name].push({
            groupId: this.env.searchModel.nextGroupId,
            value: value
        })

        this.env.searchModel.createNewFilters([{
            description: value,
            domain: [[fieldInfo.name, operator, value]],
            field: fieldInfo.name,
            custom: true
        }])

        ev.target.value = '';
        ev.target.blur();
    },

    _deleteFilter(ev) {
        this.env.searchModel.deactivateGroup(parseInt(ev.target.getAttribute('group_id')));
    },

    _onChangeSelect(ev, fieldInfo) {
        const value = ev.target.value;
        const option = this.searchFilters[fieldInfo.name];
        option.groupId && this.env.searchModel.deactivateGroup(option.groupId);
        if (value === 'all') {
            this.searchFilters[fieldInfo.name] = {
                value: 'all'
            };
        } else {
            const text = fieldInfo.selection.filter(val => {
                if (val[0] === value) {
                    return value
                }
            })[0][1];
            this.searchFilters[fieldInfo.name] = {
                groupId: this.env.searchModel.nextGroupId,
                value: value
            }
            this.env.searchModel.createNewFilters([{
                description: text,
                domain: [[fieldInfo.name, '=', value]],
                field: fieldInfo.name,
                custom: true
            }])
        }
    },

    _onChangeBoolean(ev, fieldInfo) {
        const value = ev.target.value;
        const option = this.searchFilters[fieldInfo.name];
        option.groupId && this.env.searchModel.deactivateGroup(option.groupId);
        if (value === 'all') {
            this.searchFilters[fieldInfo.name] = {
                value: 'all'
            };
        } else {
            this.searchFilters[fieldInfo.name] = {
                groupId: this.env.searchModel.nextGroupId,
                value: value
            }
            this.env.searchModel.createNewFilters([{
                description: fieldInfo.string + '' + _t(value),
                domain: [[fieldInfo.name, '=', eval(value)]],
                field: fieldInfo.name,
                custom: true
            }])
        }
    },

    getTranslation(value) {
        return _t(value)
    },

})

ListRenderer.components = {
    ...ListRenderer.components,
    DateTimeRange: DateTimeRange
}