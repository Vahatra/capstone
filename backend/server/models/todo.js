'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');
const decode = require('jwt-decode');

var credentials = new AWS.SharedIniFileCredentials({ profile: { "accessKeyId": process.env.AWS_ID, "secretAccessKey": process.env.AWS_SECRET, "region": process.env.AWS_REGION } })
AWS.config.credentials = credentials

module.exports = async function (Todo) {
    Todo.getUploadUrl = function (todoId, callback) {
        const bucket = process.env.AWS_BUCKET
        const imageId = uuid.v4()

        const s3 = new AWS.S3({
            signatureVersion: 'v4'
        })

        const url = s3.getSignedUrl('putObject', {
            Bucket: bucket,
            Key: imageId,
            Expires: 60 * 5
        })

        const imageUrl = `https://${bucket}.s3.amazonaws.com/${imageId}`

        Todo.findById(todoId, function (err, todo) {
            todo.attachmentUrl = imageUrl;
            return todo.save(function (err, updatedTodo) {
                callback(null, {
                    iamgeUrl: imageUrl,
                    uploadUrl: url
                });
            })
        })

    };

    Todo.remoteMethod('getUploadUrl', {
        http: { verb: "post", "path": "/getUploadUrl" },
        accepts: { arg: 'todoId', type: 'string' },
        returns: { arg: 'data', type: 'string' }
    });

    Todo.getTodos = function (callback) {
        const userId = decode(Todo.app.currentToken).sub;
        Todo.find({ where: { userId: userId } }, function (err, todo) {
            return callback(null, todo);
        })
    };

    Todo.remoteMethod('getTodos', {
        http: { verb: 'get' },
        returns: { arg: 'data', type: 'string' }
    });

    Todo.createTodo = function (name, dueDate, attachmentUrl, callback) {
        const userId = decode(Todo.app.currentToken).sub;
        var data = { name: name, userId: userId, dueDate: dueDate, attachmentUrl: attachmentUrl }

        Todo.create(data, function (err, todo) {
            return callback(null, todo);
        });
    };

    Todo.remoteMethod('createTodo', {
        http: { verb: 'post' },
        accepts: [{ arg: 'name', type: 'string', required: true }, { arg: 'dueDate', type: 'string', required: true }, { arg: 'attachmentUrl', type: 'string' }],
        returns: { arg: 'data', type: 'string' }
    });
};
