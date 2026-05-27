import React, { PureComponent } from "react";
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import Select from 'react-select';
import TimePicker from 'react-times';
import 'react-times/css/classic/default.css';
import ActionModal from "../ActionModal/ActionModal";

const mapStateToProps = state => {
    return {
    }
};

function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}


const datepickerStyle = {
    content: {
        width: 'auto',
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '10px'
    }
};

class DateRangePicker extends PureComponent {
    constructor() {
        super();
        this.state = {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            startMonth: new Date().getFullYear() + '-' + pad(new Date().getMonth() + 1, 2),
            endMonth: new Date().getFullYear() + '-' + pad(new Date().getMonth() + 1, 2),
            week: '' + this.getWeekNumber(new Date())[0] + '-W' + this.getWeekNumber(new Date())[1],
            startYear: new Date().getFullYear(),
            endYear: new Date().getFullYear(),
            isRangeValid: true,
            rangeTypes: [
                { label: 'day', value: 'day' },
                { label: 'week', value: 'week' },
                { label: 'month', value: 'month' },
                { label: 'year', value: 'year' }
            ],
            selectedRangeType: { label: 'day', value: 'day' },
            isTimePickerActive: false,
            startTime: '00:00',
            endTime: '23:59'
        };
    }

    componentWillMount() {
    }

    componentDidMount() {
        if (this.props.default) {
            this.setState({
                selectedRangeType: {
                    label: this.props.default,
                    value: this.props.default
                }
            });
        }

        if (this.props.isTimePickerActive) {
            this.setState({ isTimePickerActive: this.props.isTimePickerActive });
        }
    }

    static propTypes = {
        onSave: PropTypes.func.isRequired,
        onClose: PropTypes.func.isRequired,
        default: PropTypes.any,
        isTimePickerActive: PropTypes.bool
    };

    addDays = (date, days) => {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    getWeekNumber = (d) => {
        // Copy date so don't modify original
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        // Get first day of year
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        // Calculate full weeks to nearest Thursday
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        // Return array of year and week number
        return [d.getUTCFullYear(), weekNo];
    }

    getDateOfWeek = (week) => {
        var w = Number(('' + week.split('-')[1]).slice(1));
        var y = week.split('-')[0];
        var d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week

        return new Date(y, 0, d);
    }

    checkRangeValidity = () => {
        if (this.state.selectedRangeType.value == 'day') {
            const startDate = new Date(this.state.startDate);
            const endDate = new Date(this.state.endDate);

            if (this.props.isTimePickerActive === true) {
                const splitStartTime = this.state.startTime.split(":");
                const startTimeHour = parseInt(splitStartTime[0]);
                const startTimeMinute = parseInt(splitStartTime[1]);

                const splitEndTime = this.state.endTime.split(":");
                const endTimeHour = parseInt(splitEndTime[0]);
                const endTimeMinute = parseInt(splitEndTime[1]);

                startDate.setHours(startDate.getHours() + startTimeHour);
                startDate.setMinutes(startDate.getMinutes() + startTimeMinute);
                endDate.setHours(endDate.getHours() + endTimeHour);
                endDate.setMinutes(endDate.getMinutes() + endTimeMinute);
            }

            return endDate >= startDate;
        } else if (this.state.selectedRangeType.value == 'month') {
            return new Date(this.state.endMonth) >= new Date(this.state.startMonth);
            //return new Date(this.state.endMonth) >= new Date(this.state.startMonth);
        } else if (this.state.selectedRangeType.value == 'week') {
            return this.state.week.indexOf('NaN') < 0 && this.state.week !== '' && this.state.week != undefined;
        } else {
            var start = this.state.startYear;
            var end = this.state.endYear;
            var x = end - start;
            return x >= 0 && start != '';
        }
    }


    save = () => {
        var obj = {};
        obj['type'] = this.state.selectedRangeType.value;
        if (this.state.selectedRangeType.value === 'day') {
            obj['start'] = this.state.startDate;
            obj['end'] = this.state.endDate;
            obj['startTime'] = this.state.startTime;
            obj['endTime'] = this.state.endTime;
        } else if (this.state.selectedRangeType.value === 'week') {
            obj['start'] = new Date(this.getDateOfWeek(this.state.week)).toISOString().split('T')[0];
            obj['end'] = new Date(this.addDays(this.getDateOfWeek(this.state.week), 6)).toISOString().split('T')[0];
        } else if (this.state.selectedRangeType.value === 'month') {
            obj['start'] = new Date(this.state.startMonth + '-01').toISOString().split('T')[0];
            obj['end'] = new Date(this.state.endMonth + '-01').toISOString().split('T')[0];
        } else {
            obj['start'] = this.state.startYear;
            obj['end'] = this.state.endYear;
        }

        this.props.onSave(obj);
    }

    close = () => {
        this.props.onClose();
    }

    handleSelectChange = (option) => {
        if (option == null || option === undefined) {
            return;
        }
        this.setState({ selectedRangeType: option });
    }

    getDate = (date) => {
        if (this.state.selectedRangeType.value == 'week') {
            var d = this.getDateOfWeek(date);
            var x = this.getWeekNumber(d);
            var week = x[0] + '-W' + x[1];
            return week;
        } else {
            if (date != null && date != undefined && date != '') {
                return new Date(date).toISOString().split('T')[0];
            }
        }
    }

    render() {
        var { onSave, onClose, label } = this.props;
        return (
            <Modal
                isOpen={true}
                onRequestClose={this.close}
                contentLabel="Dashboard"
                style={datepickerStyle}
                shouldCloseOnOverlayClick={false}
            >
                <div className="form-group">
                    <label>Range type</label>
                    <Select required
                        name="userGroup"
                        value={this.state.selectedRangeType}
                        onChange={this.handleSelectChange}
                        options={this.state.rangeTypes}
                    />
                </div>
                {this.state.selectedRangeType.value === 'day' && (
                    <div>
                        <div className="form-group">
                            <label>Start Date</label>
                            <input className="form-control" defaultValue={this.state.startDate} type="date" onChange={(e) => this.setState({ startDate: this.getDate(e.target.value) })} />
                        </div>
                        {this.state.isTimePickerActive && (
                            <div className="form-group">
                                <label>Start Time</label>
                                <TimePicker theme="classic" timeMode="24" time={this.state.startTime} onTimeChange={(newStartTime) => { this.setState({ startTime: newStartTime.hour + ":" + newStartTime.minute }); }} />
                            </div>
                        )}
                        <div className="form-group">
                            <label>End Date</label>
                            <input className="form-control" defaultValue={this.state.endDate} type="date" onChange={(e) => this.setState({ endDate: this.getDate(e.target.value) })} />
                        </div>
                        {this.state.isTimePickerActive && (
                            <div className="form-group">
                                <label>End Time</label>
                                <TimePicker theme="classic" timeMode="24" time={this.state.endTime} onTimeChange={(newEndTime) => this.setState({ endTime: newEndTime.hour + ":" + newEndTime.minute })} />
                            </div>
                        )}
                    </div>
                )}
                {this.state.selectedRangeType.value === 'week' && (
                    <div>
                        <div className="form-group">
                            <label>Week</label>
                            <input className="form-control" defaultValue={this.state.week} type="week" onChange={(e) => this.setState({ week: e.target.value })} />
                        </div>
                    </div>
                )}
                {this.state.selectedRangeType.value === 'month' && (
                    <div>
                        <div className="form-group">
                            <label>Start Month</label>
                            <input type="month" className="form-control" defaultValue={this.state.startMonth} onChange={(e) => this.setState({ startMonth: new Date(e.target.value).getFullYear() + '-' + pad(new Date(e.target.value).getMonth() + 1, 2), })} />
                        </div>
                        <div className="form-group">
                            <label>End Month</label>
                            <input type="month" className="form-control" defaultValue={this.state.endMonth} onChange={(e) => this.setState({ endMonth: new Date(e.target.value).getFullYear() + '-' + pad(new Date(e.target.value).getMonth() + 1, 2), })} />
                        </div>
                    </div>
                )}

                {this.state.selectedRangeType.value === 'year' && (
                    <div>
                        <div className="form-group">
                            <label>Start Year</label>
                            <input type="number" defaultValue={this.state.startYear} className="form-control" max={new Date().getFullYear()} step="1" onChange={(e) => this.setState({ startYear: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>End Year</label>
                            <input type="number" defaultValue={this.state.endYear} className="form-control" max={new Date().getFullYear()} step="1" onChange={(e) => this.setState({ endYear: e.target.value })} />
                        </div>
                    </div>
                )}

                <div>{!this.checkRangeValidity() && (<i className="error">Invalid range!</i>)}</div>
                <button disabled={!this.checkRangeValidity()} onClick={this.save} className="btn btn-primary">Save</button> &nbsp; <button onClick={this.close} className="btn btn-danger">Close</button>
            </Modal>
        );
    }

}
export default connect(mapStateToProps)(DateRangePicker);
