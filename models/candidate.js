const mongoose = require('mongoose')

const candidateSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
    },
    party : {
        type : String,
        required : true,
    },
    email : {
        type : String,
        unique : true,
    },
    aadharCardNumber : {
        type : String,
        required : true,
    },
    votes : [{
        user : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "user",
        },
        votedAt : {
            type : Date,
            default : Date.now(),
        }
    }],
}, {timestamps : true}
)

const Candidate = mongoose.model("candidate", candidateSchema)


module.exports = Candidate; 
