import "./DataPage.css";
import DataBox from "./data-components/DataBox";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const DataPage = () => {
  const token = localStorage.getItem("authToken");

  const { monthId } = useParams();

  const [showCheckbox, setShowCheckbox] = useState(false);
  const [error, setError] = useState("");

  const [months, setMonths] = useState([]);
  const [data, setData] = useState([]);

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState(0);

  const payload = {
    category,
    description,
    value,
    month: `${monthId}`,
  };

  const categories = ["Income", "Expense"];

  /* ADD DATA */
  const addData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const currData = await response.json();
        console.log(currData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* GET ALL MONTHS & DATA */
  const fetchMonth = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/month`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const allMonths = await response.json();
        console.log("totodile", allMonths);
        setMonths(allMonths);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/data/${monthId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const allData = await response.json();
        console.log("chicorita", allData);
        setData(allData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchMonth();
    fetchData();
  }, []);

  const payloadSum = {};
  const incomeSumFuction = (categoryTotal) => {
    payloadSum.incomeSum = categoryTotal;
  };
  const expenseSumFuction = (categoryTotal) => {
    payloadSum.expenseSum = categoryTotal;
  };

  console.log("Slay", payloadSum);
  const monthUpdate = async (monthId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/month/${monthId}`,
        {
          method: "PUT",
          body: JSON.stringify(payloadSum),
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        fetchMonth();
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  /* PREVENT DUPLICATE CATEGORIES */
  const handleCreateData = async () => {
    let descriptionExists = false;

    for (const element of data) {
      if (element.description === description) {
        descriptionExists = true;
        break;
      }
    }

    if (descriptionExists) {
      setError("Description already exists.");
    } else {
      setError("");
      await addData();
      fetchData();
    }
  };

  /* GROUP DATA BY CATEGORY */
  const groupDataByCategory = (data) => {
    const dataGroup = {};

    data.forEach((oneData) => {
      const cat = oneData.category;

      if (!dataGroup[cat]) {
        dataGroup[cat] = [oneData];
      } else {
        dataGroup[cat].push(oneData);
      }
    });

    for (let cat in dataGroup) {
      dataGroup[cat].sort((a, b) => {
        return a.description.localeCompare(b.description);
      });
    }

    return dataGroup;
  };

  const groupedData = groupDataByCategory(data);
  const sortedCategories = Object.keys(groupedData).sort().reverse();

  /* CALCULATE THE TOTALS */
  const calculateCategoryTotal = (cat) => {
    return groupedData[cat].reduce(
      (total, oneData) => total + oneData.value,
      0
    );
  };

  return (
    <div className="dataPageBox">
      {months.map((element) => {
        if (element._id === monthId) {
          return <h1 key={element._id}>{element.name}</h1>;
        }
      })}

      <button
        type="button"
        onClick={() => setShowCheckbox(!showCheckbox)}
        className="AddDataFormCheckboxButton"
      >
        {showCheckbox ? "-" : "+"}
      </button>

      {showCheckbox && (
        <form className="addDataForm">
          <label>
            <p>Type</p>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            >
              <option value="">Select an item</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label>
            <p>Description</p>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={11}
              required
            />
          </label>

          <label>
            <p>Value</p>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
            />
          </label>

          <button
            type="button"
            onClick={() => {
              handleCreateData();
            }}
          >
            add data
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      )}

      {sortedCategories.map((category) => {
        const categoryTotal = calculateCategoryTotal(category);

        return (
          <div key={category} className="dataTypeBox" data-category={category}>
            <h2>{category}s</h2>

            {groupedData[category].map((oneData, index) => {
              if (category === "Income") {
                incomeSumFuction(categoryTotal);
              } else if (category === "Expense") {
                expenseSumFuction(categoryTotal);
              }
              return <DataBox key={index} oneData={oneData} />;
            })}

            <div className="dataBoxTotal">
              <section className="dataBoxDescription">
                <p>TOTAL</p>
              </section>

              <section className="dataBoxValue">
                <p>{categoryTotal} €</p>
              </section>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DataPage;
