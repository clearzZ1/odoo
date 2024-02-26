/** @odoo-module **/

import {useDateTimePicker} from "@web/core/datetime/datetime_hook";
import {Component} from "@odoo/owl";

const {DateTime, Info} = luxon;

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
                if(!timeValue.filter(v=>{return !!v}).length)return;
                this.props.onApply(this.props.fieldInfo, {
                    timeValue: timeValue,
                    formatValue: this.props.type === 'date'
                        ? timeValue.map(value => {
                            return value.toFormat('yyyy-MM-dd');
                        })
                        : timeValue.map(value => {
                            return value.toFormat('yyyy-MM-dd hh:mm:ss');
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