import React, { Fragment, useState, useEffect } from "react";
import "./forgotPassword.css";
import Loader from "../layout/Loader/Loader";
// import { useNavigate } from "react-router-dom";
import MailOutlineIcon from "@material-ui/icons/MailOutline";
import { useSelector, useDispatch } from "react-redux";
import { clearErrors, forgotPassword } from "../../actions/userAction"
import { useAlert } from "react-alert"
import MetaData from "../layout/MetaData";

const ForgotPassword = () => {

    // const navigate = useNavigate();

    const dispatch = useDispatch();
    const alert = useAlert();

    const { error, message, loading } = useSelector(state => state.forgotPassword)

    const [email, setEmail] = useState("")

    const forgotPasswordSubmit = (e) => {
        e.preventDefault();

        const myForm = new FormData();
        myForm.set("email", email);

        dispatch(forgotPassword(myForm));
    }

    useEffect(() => {
        if (error) {
            alert.error(message);
            dispatch(clearErrors());
        }
        if (message) {
            alert.success(message);
        }


    }, [dispatch, error, alert, message])

    return (
        <>
            {
                loading ? (<Loader />) : (<Fragment>
                    <MetaData title="Forgot Password" />
                    <div className="forgotPasswordContainer">
                        <div className="forgotPasswordBox">
                            <h2 className="forgotPasswordHeading">Forgot Password</h2>
                            <form
                                className="forgotPasswordForm"
                                onSubmit={forgotPasswordSubmit}
                            >

                                <div className="forgotPasswordEmail">
                                    <MailOutlineIcon />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        required
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <input
                                    type="submit"
                                    value="Send"
                                    className="forgotPasswordBtn"

                                />
                            </form>
                        </div>
                    </div>
                </Fragment>)
            }
        </>
    )
}

export default ForgotPassword