const express = require('express')
const path = require('path')

const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const intilizeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log(`Server Running at http://localhost:3000`)
    })
  } catch (e) {
    console.log(`Db Error ${e.message}`)
    process.exit(1)
  }
}

intilizeDatabaseAndServer()

//Get States API
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    select
        state_id as stateId,
        state_name as stateName,
        population
    from
        state;`
  const statesArray = await db.all(getStatesQuery)
  response.send(statesArray)
})

//Get State API
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  select 
        state_id as stateId,
        state_name as stateName,
        population
  from
      state
  where
   state_id = ${stateId};`
  const state = await db.get(getStateQuery)
  response.send(state)
})

//Add District API
app.post('/districts/', async (request, response) => {
  const getDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = getDetails
  const addDistrictQuery = `
  INSERT INTO 
      district(district_name, state_id, cases,cured,active,deaths)
  values(
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  );`
  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

//Get District API
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  select 
        district_id as districtId,
        district_name as districtName,
        state_id as stateId,
        cases,
        cured,
        active,
        deaths
  from
      district
  where
   district_id = ${districtId};`
  const district = await db.get(getDistrictQuery)
  response.send(district)
})

//Delete District API
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
    delete
      from district
    where
      district_id = ${districtId};`
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

//update District API
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getBody = request.body
  const {districtName, stateId, cases, cured, active, deaths} = getBody
  const updateDistrictQuery = `
  update
    district
  set 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths} 
  where
    district_id = ${districtId} ;`
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

//Get State's Stats API
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatsQuery = `
    select
        SUM(cases) as totalCases,
        SUM(cured) as totalCured,
        SUM(active) as totalActive,
        SUM(deaths) as totalDeaths
    from
        district
    where state_id = ${stateId};`
  const statsArray = await db.get(getStatsQuery)
  response.send(statsArray)
})

//Get State name of specific District API
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    ` //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery)
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    ` //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await db.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
}) //sending the required response
module.exports = app
