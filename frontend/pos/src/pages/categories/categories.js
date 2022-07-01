import React, { useEffect, useState } from "react";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/Edit";
import { connect } from "react-redux";
import { setCategories } from "../../redux/actions/categoryActions";
import { bindActionCreators } from "redux";
import Swal from "sweetalert2";
import ReactTable from "react-table-v6";
import "react-table-v6/react-table.css";

import { ActionModal } from "../../components";
import "./categories.css";
import apis from "../../apis/apis";

const Categories = (props) => {
  const { categories } = props;
  const [isEditCategoryModalVisible, setEditCategoryModalVisible] =
    useState(false);
  const [isNewCategoryModalVisible, setNewCategoryModalVisible] =
    useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [_categories, setCategories] = useState(categories);
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getCategories();
  }, []);

  useEffect(() => {}, [_categories, filteredCategories, props]);

  const getCategories = async () => {
    setIsLoading(false);

    try {
      let res = await apis.categoryApi.categories();
      setCategories(res);
      props.setCategories(res);
      setFilteredCategories(res);

      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "error",
        text: e.message,
      });
    }
  };

  const handleSearchInput = (e) => {
    if (!e) {
      setFilteredCategories([..._categories]);
      return;
    }
    let searchString = e.target.value.toLowerCase();
    let tmp = _categories.filter((cat) => {
      return cat.name.toLowerCase().indexOf(searchString) >= 0;
    });
    setFilteredCategories(tmp);
  };

  const editCategory = (cat) => {
    setSelectedCategory(cat);
    setEditCategoryModalVisible(true);
  };

  const deleteCategory = (cat) => {
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let res = await apis.categoryApi.deleteCategory(cat._id);
          getCategories();
          Swal.fire(
            "Deleted!",
            `${cat.name} was successfully deleted`,
            "success"
          );
        } catch (e) {
          Swal.fire({
            icon: "error",
            title: "error",
            text: "Something unexpected happened",
          });
        }
      }
    });
  };

  let isNotRetiredCategories = filteredCategories.filter(
    (categories) => !categories.isRetired
  );

  return (
    <div>
      <div className="container">
        <div className="row ml-0 my-3 d-flex justify-content-start align-items-center">
          <div className="w-50 d-flex justify-content-start align-items-center employees-header">
            <div className="mr-3 ml-3">
              <span className="h6">Name</span>
            </div>
            <div className="w-50">
              <input
                type="text"
                onChange={handleSearchInput}
                placeholder="search"
                name="search"
                className={"form-control input"}
              />
            </div>
          </div>
          <div className="">
            <button
              onClick={() => setNewCategoryModalVisible(true)}
              className="btn btn-primary btn-block mx-3"
            >
              <AddIcon style={{ position: "relative", bottom: "2" }} />
              <span className="h5 ml-3">New Category</span>
            </button>
          </div>
        </div>
        {isLoading ? (
          <div class="d-flex justify-content-center">
            <div
              class="spinner-border"
              style={{ width: "3rem", height: "3rem", color: "#2980B9" }}
              role="status"
            >
              <span class="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <ReactTable
            showPagination={true}
            showPageSizeOptions={false}
            minRows={0}
            data={isNotRetiredCategories}
            defaultPageSize={10}
            style={{ textAlign: "center" }}
            loadingText="Loading Products ..."
            noDataText="No products found"
            className="-highlight -striped rt-rows-height ReactTable"
            columns={[
              {
                Header: "",
                id: "row",
                maxWidth: 50,
                filterable: false,
                Cell: (row) => {
                  return (
                    <div style={{ textAlign: "center" }}>{row.index + 1}</div>
                  );
                },
              },
              {
                Header: "Name",
                accessor: "name",
              },
              {
                Header: "Actions",
                id: "actions",
                Cell: (cat) => {
                  return (
                    <div className="d-flex justify-content-center align-items-center">
                      {cat.row.name !== "General" && (
                        <>
                          <span
                            onClick={() => editCategory(cat.original)}
                            className="mr-4 table-icons"
                          >
                            <EditIcon style={{ fontSize: 20 }} />
                          </span>
                          <span
                            onClick={() => deleteCategory(cat.original)}
                            className="table-icons"
                          >
                            <DeleteIcon style={{ fontSize: 20 }} />
                          </span>
                        </>
                      )}
                    </div>
                  );
                },
              },
            ]}
          />
        )}

        {isEditCategoryModalVisible && (
          <EditCategory
            setEditModalVisible={() => setEditCategoryModalVisible(false)}
            isEditModalVisible={isEditCategoryModalVisible}
            category={selectedCategory}
            getCategories={() => getCategories()}
          />
        )}
        {isNewCategoryModalVisible && (
          <NewCategory
            setNewCategoryModalVisible={() => setNewCategoryModalVisible(false)}
            isNewCategoryModalVisible={isNewCategoryModalVisible}
            getCategories={() => getCategories()}
          />
        )}
      </div>
    </div>
  );
};

const NewCategory = (props) => {
  const {
    setNewCategoryModalVisible,
    isNewCategoryModalVisible,
    getCategories,
  } = props;
  const [name, setName] = useState("");

  const handleNameInput = (e) => setName(e.target.value);
  const handleCancleClick = () => {
    setName("");
    setNewCategoryModalVisible(false);
  };
  const handleSuccessClick = async () => {
    try {
      let res = await apis.categoryApi.addCategory({ name });
      Swal.fire(
        "Created!",
        `category: ${res.name} created successfully`,
        "success"
      );
      getCategories();
      setNewCategoryModalVisible(false);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "error",
        text: "Something unexpected happened",
      });
    }
  };

  return (
    <ActionModal
      isVisible={isNewCategoryModalVisible}
      setIsVisible={() => setNewCategoryModalVisible(false)}
      title="Edit Category"
    >
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <span className="w-25 text h6">Name</span>
          </div>
          <input
            name="name"
            placeholder="name"
            value={name}
            onChange={handleNameInput}
            type="text"
            className={"w-75 form-control input"}
          />
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
        <button
          onClick={() => handleCancleClick()}
          className="btn btn-danger mr-2"
        >
          <span className="h5 px-2">Cancel</span>
        </button>
        <button
          onClick={() => handleSuccessClick()}
          className="btn btn-success mr-2"
        >
          <span className="h5 px-2">Save</span>
        </button>
      </div>
    </ActionModal>
  );
};

const EditCategory = (props) => {
  const { setEditModalVisible, isEditModalVisible, category, getCategories } =
    props;
  const [name, setName] = useState(category.name);

  const handleNameInput = (e) => setName(e.target.value);
  const handleCancleClick = () => {
    setName("");
    setEditModalVisible(false);
  };
  const handleSuccessClick = async () => {
    try {
      let res = await apis.categoryApi.editCategory(category._id, { name });
      Swal.fire(
        "Updated!",
        `category: ${res.name} updated successfully`,
        "success"
      );
      getCategories();
      setEditModalVisible(false);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "error",
        text: "Something unexpected happened",
      });
    }
  };

  return (
    <ActionModal
      isVisible={isEditModalVisible}
      setIsVisible={() => setEditModalVisible(false)}
      title="Edit Category"
    >
      <div className="mx-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <span className="w-25 text h6">Name</span>
          </div>
          <input
            name="name"
            placeholder="name"
            value={name}
            onChange={handleNameInput}
            type="text"
            className={"w-75 form-control input"}
          />
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-4 mx-5">
        <button
          onClick={() => handleCancleClick()}
          className="btn btn-danger mr-2"
        >
          <span className="h5 px-2">Cancel</span>
        </button>
        <button
          onClick={() => handleSuccessClick()}
          className="btn btn-success mr-2"
        >
          <span className="h5 px-2">Save</span>
        </button>
      </div>
    </ActionModal>
  );
};

const mapStateToProps = ({ category }) => {
  return {
    categories: category.categories,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ setCategories }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Categories);
