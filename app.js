const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`Database error: ${e.message}`)
  }
}
initializeDbAndServer()

//API 1 - GET (accepts query in the url and respond accordingly)
//Queries: status, priority, search_q
app.get('/todos/', async (request, response) => {
  const {status, priority, search_q = ''} = request.query
  let getTodoQuery = ''
  const priorityAndStatus = (priority, status) => {
    return priority !== undefined && status !== undefined
  }
  const onlyPriority = priority => {
    return priority !== undefined
  }
  const onlyStatus = status => {
    return status !== undefined
  }
  switch (true) {
    case priorityAndStatus(priority, status):
      getTodoQuery = `
      SELECT * FROM todo 
      WHERE todo LIKE '%${search_q}%'
      AND status = '${status}'
      AND priority = '${priority}';`
      break
    case onlyPriority(priority):
      getTodoQuery = `
      SELECT * FROM todo
      WHERE todo LIKE '%${search_q}%'
      AND priority = '${priority}';`
      break
    case onlyStatus(status):
      getTodoQuery = `
      SELECT * FROM todo
      WHERE todo LIKE '%${search_q}%'
      AND status = '${status}';`
      break
    default:
      getTodoQuery = `
      SELECT * FROM todo
      WHERE todo LIKE '%${search_q}%'`
  }
  const todosList = await db.all(getTodoQuery)
  response.send(todosList)
})

//API 2 - GET
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodo = `
  SELECT * FROM todo
  WHERE id = ${todoId};`
  const todoItem = await db.get(getTodo)
  response.send(todoItem)
})

//API 3 - POST
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const addTodo = `
  INSERT INTO todo 
  (id, todo, priority, status)
  VALUES 
  (${id}, '${todo}', '${priority}', '${status}');`
  await db.run(addTodo)
  response.send('Todo Successfully Added')
})

//API 4 - PUT
app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  let updateTodo = ''
  const {status, priority, todo} = request.body
  if (status !== undefined) {
    updateTodo = `
    UPDATE todo 
    SET 
    status = '${status}'
    WHERE id = ${todoId};`
    await db.run(updateTodo)
    response.send('Status Updated')
  }
  if (priority !== undefined) {
    updateTodo = `
    UPDATE todo
    SET 
    priority = '${priority}'
    WHERE id = ${todoId};`
    await db.run(updateTodo)
    response.send('Priority Updated')
  }
  if (todo !== undefined) {
    updateTodo = `
    UPDATE todo 
    SET 
    todo = '${todo}'
    WHERE id = ${todoId};`
    await db.run(updateTodo)
    response.send('Todo Updated')
  }
})

//API 5 - DELETE

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const deleteTodo = `
  DELETE FROM todo 
  WHERE id = ${todoId}`
  await db.run(deleteTodo)
  response.send('Todo Deleted')
})

module.exports = app