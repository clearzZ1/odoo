/** @odoo-module **/

import {useDateTimePicker} from "@web/core/datetime/datetime_hook";
import {Component} from "@odoo/owl";

import {
    formatDate,
    formatDateTime,
    serializeDate,
    serializeDateTime,
} from "@web/core/l10n/dates";

export class DateTimeRange extends Component {
    setup() {
        const getPickerProps = () => {
            return {
                value: [false, false],
                type: this.props.type,
                range: true,
                showWeekNumbers: true
            }
        };
        useDateTimePicker({
            get pickerProps() {
                return getPickerProps();
            },
            onApply: (timeValue) => {
                if (!timeValue.filter(v => {
                    return !!v
                }).length) return;
                this.props.onApply(this.props.fieldInfo, {
                    timeValue: timeValue,
                    formatValue: this.props.type === 'date'
                        ? timeValue.map(value => {
                            return [
                                serializeDate(value),
                                formatDate(value)
                            ];
                        })
                        : timeValue.map(value => {
                            return [
                                serializeDateTime(value),
                                formatDateTime(value)
                            ];
                        })
                });
            },
        });
    }
}

DateTimeRange.props = {
    fieldInfo: {type: Object},
    type: {type: String},
    onApply: {type: Function, optional: true},
}
DateTimeRange.template = 'DateTimeRange';