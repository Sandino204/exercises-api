const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const Schema = mongoose.Schema
const dateT = require("date-and-time")

const client = mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true})


app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))


const userModel = new Schema({
  username: {
    type: String, 
    required: true
  }
})

const exerciseModel = new Schema({
  username: {
    type: String, 
    required: true, 
  }, 
  description: {
    type: String, 
    required: true
  },
  duration: {
    type: Number, 
    required: true
  },
  date: {
    type: Date
  }
})

const User = mongoose.model('User', userModel)
const Exercise = mongoose.model("Exercise", exerciseModel)


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if(err){
      console.log(err)
      return res.status(500).json({
        err: "Something was wrong"
      })
    }

    return res.status(200).json(data)
  })
})

app.post("/api/users", (req, res) => {
  const {username} = req.body
  
  
  User.create({
    username: username
  },(err, data) => {
    if(err){
      console.log(err)
      return res.status(500).json({
        err: "Something was wrong"
      })
    }

    return res.status(200).json(data)
  })
})

app.post("/api/users/:_id/exercises", (req, res) => {
  const {_id} = req.params
  const {description, duration, date} = req.body

  User.findById(_id, (err, user) => {
    if(err){
      console.log(err)
      return res.status(500).json({
        err: "Something was wrong"
      })
    }

    Exercise.create({
      username: user.username,
      description: description,
      duration: duration, 
      date: date ? new Date(dateT.parse(date, 'YYYY-MM-DD')) : new Date(), 
    }, (err, data) => {
      if(err){
        console.log(err)
        return res.status(500).json({
          err: "Something was wrong"
        })
      }
      console.log(data.date)

      return res.status(200).json({
        _id: user._id, 
        username: user.username, 
        date: dateT.format(new Date(data.date), "ddd MMM DD YYYY"),
        duration: data.duration, 
        description: data.description
      })

    })
  })
})

app.get("/api/users/:_id/logs", (req, res) => {
  const {_id} = req.params
  const {from, to, limit} = req.query

  User.findById(_id, (err, user) => {
    if(err){
      console.log(err)
      return res.status(500).json({
        err: "Something was wrong"
      })
    }

    const exe = Exercise.find({username: user.username}, (err, data) => {
      if(err){
        console.log(err)
        return res.status(500).json({
          err: "Something was wrong"
        })
      }

      let exercises = data.map(exercise => {
      
        return {
          description: exercise.description, 
          duration: exercise.duration, 
          date: exercise.date
        }
      })

      if(from){
        exercises = exercises.filter(exercise => {
          if(new Date(exercise.date) > (new Date(from))){
            return true
          }else{
            return false
          } 
        })
      }

      if(to){
        exercises = exercises.filter(exercise => {
          if(new Date(exercise.date) < (new Date(to))){
            return true
          }else{
            return false
          } 
        })
      }

      if(limit){
        exercises = exercises.slice(0, limit)
      }

      exercises = exercises.map(exercise => {
        exercise.date = dateT.format(exercise.date, "ddd MMM DD YYYY")

        return exercise
      })

      return res.status(200).json({
        _id: user._id, 
        username: user.username, 
        count: data.length, 
        log: exercises
      })
    })
  })
})






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
