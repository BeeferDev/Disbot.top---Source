const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    message: { "429": "Too many requests, please try again in 15 minutes" }
});
const apiLimiter2 = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
});

function convertData(obj, type) {
    if(obj == "prefix") {
        if(type == 1) return 'Customizable';
        if(type == 0) return 'Fixed';
    }
    if(obj == "cert") {
        if(type == 1) return 'Yes';
        if(type == 0) return 'No';
    }
    if(obj == "perms") {
        if(type == 0) return 'User'
        if(type == 1) return 'Reviewer'
        if(type == 2) return 'Administrator'
    }
    if(obj == "staffactions") {
        if(type == 0) return 'No'
        if(type == 1) return 'Yes'
    }
}

module.exports = function(app, connection) {
    console.log(`[V3-API]: Launched`);

    app.post('/api/v3/bot/:botId/update', (req, res) => {
        let botId = req.params.botId;
        let auth = req.headers.authorization;
        let newServerCount = Number(req.body.serverCount);
        let newonlineStamp = Date.now();
        if(Number.isNaN(newServerCount)) return // console.log(`Test Output 6`);
        connection.query(`SELECT * FROM bots WHERE botId = '${botId}'`, (err, results) => {
            if(results[0]) {
                if(results[0].authToken == auth) {
                    var temp = Number(results[0].onlineStamp) + 300000;
                    if(newonlineStamp > temp) {
                        if(Number.isInteger(newServerCount)) {
                            connection.query(`UPDATE bots SET serverCount = ${newServerCount}, onlineStamp = '${newonlineStamp}' WHERE botId = '${botId}'`, (err, result) => {
                                let json_ = {
                                    status: "200 OK",
                                    error: "Server count updated.",
                                }
                                res.status(200).type('json').send(JSON.stringify(json_, null, 4) + '\n');
                            });
                        } else {
                            let json_ = {
                                status: "400 Bad Request",
                                error: "The server count supplied was not an integer.",
                            }
                            res.status(400).type('json').send(JSON.stringify(json_, null, 4) + '\n');
                        }
                    } else {
                        let json_ = {
                            status: "429 Too Many Requests",
                            error: "You can only make one request per 5 minutes.",
                        }
                        res.status(429).type('json').send(JSON.stringify(json_, null, 4) + '\n');
                    }
                } else {
                    let json_ = {
                        status: "401 Unauthorized",
                        error: "Invalid or incorrect bot token supplied.",
                    }
                    res.status(401).type('json').send(JSON.stringify(json_, null, 4) + '\n');
                }
            } else {
                let json_ = {
                    status: "404 Not Found",
                    error: "Bot not found on disbot.top",
                }
                res.status(404).type('json').send(JSON.stringify(json_, null, 4) + '\n');
            }
        });
    });

    app.get('/api/v3/bot/:botId/get', apiLimiter, (req, res) => {
        let botId = req.params.botId;
        let auth = req.headers.authorization;
        if(!auth) return res.status(400).type('json').send(JSON.stringify({ status: "400 Bad Request", error: "missing authorization.." }, null, 4) + '\n');
        
        connection.query(`SELECT * FROM bots WHERE botId = '${botId}'`, (err, results) => {        
            if(results[0]) {
                connection.query(`SELECT * FROM bots WHERE authToken = '${auth}'`, function(err, result) {
                    if(result[0].authToken == auth) {
                        let tags = []
                        if(results[0].tagFun) {
                            tags.push("Fun")
                        } if(results[0].tagGames) {
                            tags.push("Games")
                        } if(results[0].tagMusic) {
                            tags.push("Music")
                        } if(results[0].tagEco) {
                            tags.push("Eco")
                        } if(results[0].tagMod) {
                            tags.push("Mod")
                        } if(results[0].tagAutomod) {
                            tags.push("Automod")
                        } if(results[0].tagLeveling) {
                            tags.push("Levelling")
                        } if(results[0].tagSocial) {
                            tags.push("Social")
                        } if(results[0].tagUtility) {
                            tags.push("Utility")
                        }
                        
                        let json_ = {
                            id: results[0].botId,
                            username: results[0].botName,
                            creator: results[0].creatorName,
                            owners: results[0].otherOwners,
                            servers: results[0].serverCount || 0,
                            library: results[0].library,
                            votes: results[0].votes,
                            tags: tags,
                            certified: convertData("cert", results[0].certified),
                            prefix: results[0].prefix,
                            prefixType: convertData("prefix", results[0].prefixChange),
                            avatar: results[0].botIcon,
                            websiteLink: results[0].websiteLink,
                            inviteLink: results[0].inviteUrl,
                            githubLink: results[0].GithubLink,
                            donateLink: results[0].donateLink,
                            short: results[0].shortDesc,
                            long: results[0].longDesc
                        }
                        res.status(200).type('json').send(JSON.stringify(json_, null, 4) + '\n');
                    } else {
                        let json_ = {
                            status: "401 Unauthorized",
                            error: "Invalid or incorrect bot token supplied.",
                        }
                        res.status(401).type('json').send(JSON.stringify(json_, null, 4) + '\n');
                    }
                });
            } else {
                let json_ = {
                    status: "404 Not Found",
                    error: "Bot not found on disbot.top",
                }
                res.status(404).type('json').send(JSON.stringify(json_, null, 4) + '\n');
            }
        });
    });

    app.get('/api/v3/bot/:botId/votes/get', apiLimiter, (req, res) => {
        let botId = req.params.botId;
        let auth = req.headers.authorization;
        if(!auth) return res.status(400).type('json').send(JSON.stringify({ status: "400 Bad Request", error: "missing authorization.." }, null, 4) + '\n');
        
        connection.query(`SELECT * FROM votes WHERE botId = '${botId}'`, (err, results) => {
            if(results[0]) {
                connection.query(`SELECT * FROM bots WHERE authToken = '${auth}'`, function(err, result) {
                    if(result[0].authToken == auth) {
                        let daArray = [];
                        results.forEach(element => {
                            daArray.push({voterId: element.userId, rating: element.rating, date: element.date});
                        });
                        res.status(200).type('json').send(JSON.stringify(daArray, null, 4) + '\n');
                    } else {
                        let json_ = {
                            status: "401 Unauthorized",
                            error: "Invalid or incorrect bot api token supplied.",
                        }
                        res.status(401).type('json').send(JSON.stringify(json_, null, 4) + '\n');
                    }
                });
            } else {
                let json_ = {
                    status: "404 Not Found",
                    error: "Bot not found on disbot.top",
                }
                res.status(404).type('json').send(JSON.stringify(json_, null, 4) + '\n');
            }
        });
    });

    app.get('/api/v3/user/:userId/get', apiLimiter, (req, res) => {
        let userId = req.params.userId;
        let auth = req.headers.authorization;
        if(!auth) return res.status(400).type('json').send(JSON.stringify({ status: "400 Bad Request", error: "missing authorization.." }, null, 4) + '\n');
        
        connection.query(`SELECT * FROM users WHERE userId = '${userId}'`, function(err, results) {
            if(results[0]) {
                connection.query(`SELECT * FROM bots WHERE authToken = '${auth}'`, function(err, result) {
                    if(result[0].authToken == auth) {
                        let json_ = {
                            user: {
                                id: results[0].userId,
                                username: results[0].userName,
                                avatar: results[0].userIcon,
                                permission: convertData("perms", results[0].perm),
                                blacklisted: convertData("staffactions", results[0].blacklisted),
                                postban: convertData("staffactions", results[0].postban),
                                bio: results[0].bio
                            },
                            socials: {
                                discord: results[0].discordSocial,
                                twitter: results[0].twitterSocial,
                                github: results[0].githubSocial
                            },
                        }
                        res.status(200).type('json').send(JSON.stringify(json_, null, 4) + '\n')
                    } else {
                        let json_ = {
                            status: "401 Unauthorized",
                            error: "Invalid or incorrect bot api token supplied.",
                        }
                        res.status(401).type('json').send(JSON.stringify(json_, null, 4) + '\n');
                    }
                });
            } else {
                let json_ = {
                    status: "404 Not Found",
                    error: "User not found on disbot.top.",
                }
                res.status(404).type('json').send(JSON.stringify(json_, null, 4) + '\n');
            }
        })
    })
}