import React from "react";
import { connect } from "react-redux";
import { Route } from "react-router-dom";

const CustomRoute = (props) => {
  const { user = {}, allowedRoles = [], notFound: NotFound, ...routeProps } = props;
  const roles = user.roles || [];
  const isAllowed = roles.some((role) =>
    role.name === "Administrator" || allowedRoles.includes(role.name)
  );

  if (!isAllowed) {
    return <Route component={NotFound} />;
  }

  return <Route {...routeProps} />;
};

const mapStateToProps = () => ({});
export default connect(mapStateToProps, null)(CustomRoute);
