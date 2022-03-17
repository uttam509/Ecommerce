import React, { Fragment, useEffect } from 'react'
import { DataGrid } from "@material-ui/data-grid"
import "./productList.css"
import { useSelector, useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { useAlert } from "react-alert"
import { Button } from '@material-ui/core'
import MetaData from "../layout/MetaData"
import EditIcon from "@material-ui/icons/Edit"
import DeleteIcon from "@material-ui/icons/Delete"
import Sidebar from "./Sidebar"
import { DELETE_USER_RESET } from "../../constants/userConstants"
import { getAllUsers, clearErrors, deleteUser } from "../../actions/userAction"

const UsersList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch()
    const alert = useAlert()

    const { error, users } = useSelector(state => state.allUsers);
    const { error: deleteError, isDeleted, message } = useSelector(state => state.profile);

    const deleteUserHandler = (id) => {
        dispatch(deleteUser(id))
    }

    useEffect(() => {
        if (error) {
            alert.error(error);
            dispatch(clearErrors())
        }
        if (deleteError) {
            alert.error(deleteError);
            dispatch(clearErrors())
        }
        if (isDeleted) {
            alert.success(message);
            navigate("/admin/users")
            dispatch({ type: DELETE_USER_RESET })
        }
        dispatch(getAllUsers())
    }, [dispatch, error, alert, deleteError, isDeleted, navigate,message])

    const columns = [
        { field: "id", headerName: "User ID", minWidth: 200, flex: 0.5 },
        {
            field: "email",
            headerName: "Email",
            minWidth: 100,
            flex: 0.6,
        },
        {
            field: "name",
            headerName: "Name",
            minWidth: 150,
            flex: 0.5,
        },
        {
            field: "role",
            headerName: "Role",
            minWidth: 100,
            flex: 0.3,
            cellClassName: (params) => {
                return params.getValue(params.id, "role") === "admin" ? "greenColor" : "redColor"
              }
        },
        {
            field: "actions",
            flex: 0.3,
            minWidth: 150,
            type: "number",
            sortable: false,
            renderCell: (params) => {
                return (
                    <Fragment>
                        <Link to={`/admin/user/${params.getValue(params.id, 'id')}`}>
                            <EditIcon />
                        </Link>
                        <Button onClick={() => deleteUserHandler(params.getValue(params.id, 'id'))}>
                            <DeleteIcon />
                        </Button>
                    </Fragment>
                )
            }
        }
    ];

    const rows = [];

    users && users.forEach((item) => {
        rows.push({
            id: item._id,
            role: item.role,
            email: item.email,
            name: item.name
        })
    })


    return (
        <Fragment>
            <MetaData title={`ALL USERS - ADMIN`} />

            <div className="dashboard">
                <Sidebar />
                <div className="productListContainer">
                    <h1 id="productListHeading">All USERS</h1>

                    <DataGrid
                        rows={rows}
                        columns={columns}
                        pageSize={10}
                        disableSelectionOnClick
                        className="productListTable"
                        autoHeight
                    />

                </div>
            </div>

        </Fragment>
    )
}


export default UsersList