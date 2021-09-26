const path = require("path");
const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DBError: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// 1
app.get("/todos/", async (request, response) => {
  let data = "";
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    //scenario 3
    case request.query.priority !== undefined &&
      request.query.status !== undefined:
      getTodosQuery = `  
            SELECT *
            FROM todo
            WHERE
                todo LIKE '%${search_q}%' AND
                priority = '${priority}' AND 
                status = '${status}';
        `;
      break;
    //   scenario 2
    case request.query.priority !== undefined:
      getTodosQuery = `  
            SELECT *
            FROM todo
            WHERE
                todo LIKE '%${search_q}%' AND
                priority = '${priority}';
        `;
      break;
    //   scenario 1
    case request.query.status !== undefined:
      getTodosQuery = `  
            SELECT *
            FROM todo
            WHERE
                todo LIKE '%${search_q}%' AND
                status = '${status}';
        `;
      break;
    default:
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE
                todo LIKE '%${search_q}%';
          `;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

// 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT *
        FROM todo
        WHERE id = ${todoId};
    `;
  const getTodo = await db.get(getTodoQuery);
  response.send(getTodo);
});

// 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
        INSERT INTO todo(id, todo, priority, status)
        VALUES( 
             ${id},
           '${todo}',
           '${priority}',
           '${status}'
        );
    `;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

// 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo } = request.body;
  let updateColumn = "";
  switch (true) {
    case status !== undefined:
      updateColumn = "Status";
      break;
    case priority !== undefined:
      updateColumn = "Priority";
      break;
    case todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};
  `;
  const getTodo = await db.get(getTodoQuery);

  const updateQuery = `
    UPDATE todo
    SET
        todo = '${getTodo.todo}',
        priority = '${getTodo.priority}',
        status = '${getTodo.status}'
    WHERE
        id = ${todoId};
  `;
  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

// 5
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM todo
        WHERE id = ${todoId};
    `;
  const deleteTodo = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
