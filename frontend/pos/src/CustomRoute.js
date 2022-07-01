import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Redirect, Route } from "react-router-dom";

const CustomRoute = (props) => {
  const [returnedRoute, setReturnedRoute] = useState("");
  useEffect(() => {
    props.User.roles.map((role) => {
      switch (role.name) {
        case "Administrator":
          return setReturnedRoute(
            role.name === "Administrator" ? (
              <Route {...props} />
            ) : (
              <Route component={props.notFound} />
            )
          );
        case "Items":
          return setReturnedRoute(
            role.name === "Items" ? (
              <Route {...props} />
            ) : (
              <Route component={props.notFound} />
            )
          );
        case "Sales":
          return setReturnedRoute(
            role.name === "Sales" ? (
              <Route {...props} />
            ) : (
              <Route component={props.notFound} />
            )
          );
        case "Customers":
          return setReturnedRoute(
            role.name === "Customers" ? (
              <Route {...props} />
            ) : (
              <Route component={props.notFound} />
            )
          );
        case "Reports":
          return setReturnedRoute(
            role === "Reports" ? (
              <Route {...props} />
            ) : (
              <Route component={props.notFound} />
            )
          );
        case "Employees":
          return setReturnedRoute(
            role === "Employees" ? (
              <Route {...props} />
            ) : (
              <Route component={props.notFound} />
            )
          );
        case "Settings":
          return setReturnedRoute(
            role === "Settings" ? (
              <Route {...props} />
            ) : (
              <Route component={props.notFound} />
            )
          );

        default:
          return setReturnedRoute(<Route component={props.notFound} />);
      }
    });
  }, [props.user]);
  return <>{returnedRoute}</>;
};

const mapStateToProps = () => ({});
export default connect(mapStateToProps, null)(CustomRoute);
