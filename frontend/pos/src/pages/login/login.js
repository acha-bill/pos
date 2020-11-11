import { Component } from "react";
import React from "react";
import Swal from 'sweetalert2'
import apis from '../../apis/apis'
import { setRoles } from '../../redux/actions/roleActions'
import { setUser, setToken } from '../../redux/actions/authActions'
import 'bootstrap/dist/css/bootstrap.min.css';
import './login.css'
import { connect } from "react-redux";


class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: ""
        }
    }

    handleInput = event => {
        this.setState({
            [event.target.name]: event.target.value
        })
    }

    handleSubmit = async event => {
        event.preventDefault()
        const { username, password } = this.state
        apis.initialize('')
        try {
            let res = await apis.authApi.login({
                username,
                password
            })
            apis.initialize(res.token)
            let roles = await apis.roleApi.roles()
            let userRoles = []
            if (res.user.roles) {
                userRoles = roles.filter(r => res.user.roles.findIndex(ur => ur === r._id) >= 0)
            }
            res.user.roles = userRoles
            this.props.setToken(res.token)
            this.props.setUser(res.user)
            this.props.setRoles(roles)

            sessionStorage.setItem('TOKEN', res.token);
            sessionStorage.setItem('USER', JSON.stringify(res.user));

            console.log(res.user.roles[0].name);
            if (res.user.roles[0].name === "Administrator") {
                this.props.history.push("/sales")
            } else {
                let page = res.user.roles[0].name;
                this.props.history.push(`/${page}`)
            }

        } catch (e) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: e.response ? e.response.data.error : 'Error connecting to API'
            })
        }
    }

    render() {
        let { username, password } = this.state;
        console.log(this.props.history)
        return (
            <div className={"main-container d-flex justify-content-center align-items-center"}>
                <div>
                    <div className={"text-center my-4"}>
                        <span className={"h2 welcome-heading"}>Login to POS</span>
                    </div>
                    <form className={"login-form form"} onSubmit={this.handleSubmit}>
                        <div className={"form-group"}>
                            <input name="username" placeholder="username" value={username} onChange={this.handleInput} type="text" className={"form-control input"} />
                        </div>
                        <div className={"form-group"}>
                            <input name="password" placeholder="password" value={password} onChange={this.handleInput} type="password" className={"form-control input"} />
                        </div>
                        <div>
                            <button className="btn btn btn-primary btn-block mt-2"><span className="h5">Login</span></button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}

const mapStatesToProps = () => {
    return {}
}
export default connect(mapStatesToProps, { setToken, setUser, setRoles })(Login);
