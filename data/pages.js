'use strict'

const promise = require("bluebird")
const moment = require("moment");
const momentTz = require("moment-timezone")
const dataStore = require("./connection").Datastore;
const uuid = require('uuid/v4');

exports.GetPageProd = bucket => {
    if (bucket) {
        return dataStore.createQuery(bucket).run()
            .then(res => {
                return res[0][0];
            })
            .catch(err => {
                return err
            })
    } else {
        return promise.resolve({})
    }
}

exports.GetPageListProd = (bucket, limit) => {
    if (bucket && limit) {
        return dataStore.createQuery(bucket).order('Position', { descending: false }).limit(limit).run()
            .then(res => {
                return res[0];
            })
            .catch(err => {
                return err
            })
    } else {
        return promise.resolve({})
    }
}

exports.GetPageByKindAndIndex = (bucket, index) => {
    if (bucket && index) {
        return dataStore.createQuery(bucket).filter('Index', '=', index).run()
            .then(res => {
                return res[0][0];
            })
            .catch(err => {
                return err
            })
    } else {
        return promise.resolve({})
    }
}

exports.GetPage = getPage;
function getPage(bucket) {
    return dataStore.createQuery(bucket).order('DateCreate', { descending: true }).run()
        .then(res => {
            return res[0];
        })
        .catch(err => {
            return null
        })
}

exports.GetPageById = getPageById;

function getPageById(id, bucket) {
    return dataStore.createQuery(bucket).filter('Id', '=', id).run()
        .then(res => {
            return res[0][0]
        })
        .catch(err => {
            return false
        })
}

exports.SetActive = (id, bucket) => {
    return promise.join(getPage(bucket), getPageById(id, bucket + "-tmp"),
        (activeNav, navTmp) => {
            return promise.all([
                dataStore.insert(schemaPage(navTmp, bucket)),
                dataStore.delete(dataStore.key([bucket, activeNav[0][dataStore.KEY].name]))
            ])
        })
        .then(() => {
            return true
        })
        .catch(() => {
            return false
        })
}

exports.SetNewPage = setNewPage;
function setNewPage(data, bucket) {
    return dataStore.save(schemaPage(data, bucket + "-tmp"))
        .then(() => {
            return true;
        })
        .catch((err) => {
            return false;
        });
}

exports.InsertToProd = (data, bucket) => {
    return dataStore.insert(schemaPage(data, bucket))
        .then(() => {
            return true;
        })
        .catch((err) => {
            return false;
        });
}

exports.DropAllCollation = bucket => {
    return dataStore.createQuery(bucket).select('__key__').run()
        .then(entities => {
            const keys = entities[0].map((entity) => {
                return entity[dataStore.KEY];
            });
            return dataStore.delete(keys)
        })
        .then(() => {
            return true;
        })
        .catch(() => {
            return false;
        })
}

function schemaPage(data, bucket) {
    const id = uuid();
    const key = dataStore.key([bucket, id]);
    const condition = {
        key: key,
        excludeFromIndexes: [
            "Data.Content.ContentHtml",
            "Data.Accordion[].AccordionDescription",
            "Data.NewsText",
            "Data.ProfileText",
            "Data.Pixels",
            "Data.Request",
            "Data.ModelTitle",
            "Data.StaticsBlocks.SalesContentBlock",
            "Data.StaticsBlocks.StoryContentBlock",
            "Data.StaticsBlocks.RecommendationContentBlock",
            "Data.StaticsBlocks.BlogsContentBlock"
        ],
        data: {
            DateCreate: data.DateCreate || moment().tz("Asia/Jerusalem").toDate(),
            DateCreateDB: data.DateCreateDB || new Date().valueOf(),
            Data: data.Data || data,
            UserName: data.UserName || 'admin',
            Id: data.Id || uuid(),
            Position: data.Position || 0,
            Index: data.Index || data.Position || 0,
            Language: data.Language || 'he'
        }
    };
    return condition;
}

exports.DeletePage = (id, bucket) => {
    return getPageById(id, bucket)
        .then(item => {
            return dataStore.delete(dataStore.key([bucket, item[dataStore.KEY].name]))
        })
        .catch(err => {
            return false
        })
}


exports.GetSales = (lang="") => dataStore.createQuery(lang + "sales").order('Position', { descending: false }).run();
exports.GetNews = (lang="") => dataStore.createQuery(lang + "newspandoor").order('Position', { descending: false }).run();
exports.GetBlogs = (lang="") => dataStore.createQuery(lang + "blogslist").order('Position', { descending: false }).limit(2).run();
exports.GetInstallers = () => dataStore.createQuery("installers").order('Position', { descending: false }).run();

exports.GetNavigationItemsForProd = (lang="") => dataStore.createQuery(lang + "navigation").order('Position', { descending: false }).run();
exports.GetFooterItemsForProd = (lang="") => dataStore.createQuery(lang + "footer").order('Position', { descending: false }).run();
exports.GetBranchesItemsForProd = (lang="") => dataStore.createQuery(lang + "brancheslist").order('Position', { descending: false }).run();
exports.GetComments = (lang="") => dataStore.createQuery(lang + "commentslist").order('Position', { descending: false }).limit(4).run();

exports.RecommendedList = (lang="") => dataStore.createQuery(lang + "recommendedlist").order('Position', { descending: false }).limit(4).run();
exports.GetAllArchitects = () => dataStore.createQuery("architectslist-tmp").order('Data.Name', { descending: false }).run();
exports.GetCollectionsList = bucket => dataStore.createQuery(bucket).order('Data.CollectionName', { descending: false }).run();
exports.GetDoorsPagesList = bucket => dataStore.createQuery(bucket).order('Position', { descending: false }).run();

exports.UpdateArchitectById = (id, data) => {
    return getPageById(id, "architectslist-tmp")
        .then(item => {
            if (item) {
                return dataStore.save({
                    key: dataStore.key(["architectslist-tmp", item[dataStore.KEY].name]),
                    excludeFromIndexes: [
                        "Data.ProfileText"
                    ],
                    data: {
                        DateCreate: item.DateCreate || moment().tz("Asia/Jerusalem").toDate(),
                        DateCreateDB: item.DateCreateDB || new Date().valueOf(),
                        Data: data,
                        UserName: item.UserName || 'admin',
                        Id: item.Id || uuid(),
                        Position: item.Position || 0,
                        Index: item.Index || item.Position || 0,
                        Language: data.Language || 'he'
                    }
                })
            } else {
                return promise.reject(true)
            }
        })
        .catch(err => {
            return promise.reject(true)
        })
}

exports.GetAllArchitectProjects = id => dataStore.createQuery("projects").filter('Data.ArchitectId', ' = ', id).run();

exports.SetRedirects = redirects => {
    return dataStore.createQuery("redirects").run()
        .then(old => {
            return promise.all([
                dataStore.insert(schemaPage(redirects, "redirects")),
                dataStore.delete(dataStore.key(["redirects", old[0][0][dataStore.KEY].name]))
            ])
        })
        .then((r) => {
            return true;
        })
        .catch(err => {
            return false;
        })
}

exports.GetRedirects = () => {
    return dataStore.createQuery("redirects").run()
        .then(redirects => {
            if (redirects) {
                return redirects[0][0].Data.Links
            } else {
                return []
            }
        })
        .catch(err => {
            return []
        })
}

exports.SetNotActiveIncomingRequestById = (id, requestType) => {
    return getPageById(id, requestType)
        .then(item => {
            if (item) {
                item.Data.Active = false;
                return dataStore.save({
                    key: dataStore.key([requestType, item[dataStore.KEY].name]),
                    excludeFromIndexes: [
                        "Data.Request"
                    ],
                    data: {
                        DateCreate: item.DateCreate || moment().tz("Asia/Jerusalem").toDate(),
                        DateCreateDB: item.DateCreateDB || new Date().valueOf(),
                        Data: item.Data,
                        UserName: item.UserName || 'admin',
                        Id: item.Id || uuid(),
                        Position: item.Position || 0,
                        Index: item.Index || item.Position || 0
                    }
                })
            } else {
                return promise.reject(true)
            }
        })
        .catch(err => {
            return promise.reject(true)
        })
}

exports.GetActiveApplicant = bucket => dataStore.createQuery(bucket).filter('Data.Active', ' = ', true).run();

exports.UpdateCollectionById = (id, data, bucket) => {
    return getPageById(id, bucket + "-tmp")
        .then(item => {
            if (item) {
                return dataStore.save({
                    key: dataStore.key([bucket + "-tmp", item[dataStore.KEY].name]),
                    excludeFromIndexes: [
                        "Data.ModelTitle"
                    ],
                    data: {
                        DateCreate: item.DateCreate || moment().tz("Asia/Jerusalem").toDate(),
                        DateCreateDB: item.DateCreateDB || new Date().valueOf(),
                        Data: data,
                        UserName: item.UserName || 'admin',
                        Id: item.Id || uuid(),
                        Position: item.Position || 0,
                        Index: item.Index || item.Position || 0,
                        Language: data.Language || 'he'
                    }
                })
            } else if (id && bucket.includes("_")) {
                return setNewPage(data, bucket)
            } else {
                return promise.reject(false)
            }
        })
        .catch(err => {
            return promise.reject(true)
        })
};

exports.GetCountOfBucket = bucket => {
    if (bucket) {
        return dataStore.createQuery(bucket).run()
            .then(res => {
                return res[0].length;
            })
            .catch(err => {
                return err
            })
    } else {
        return promise.resolve({})
    }
}

exports.GetPartialByPageAndLimit = (bucket, fromPosition, limit) => {
    return dataStore.createQuery(bucket).filter('Position', ' >= ', fromPosition).limit(limit).run()
        .then(res => {
            return res[0];
        })
        .catch(err => {
            return err
        })
}

exports.SetCommonWords = redirects => {
    return dataStore.createQuery("commonwords").run()
        .then(old => {
            return promise.all([
                dataStore.insert(schemaPage(redirects, "commonwords")),
                dataStore.delete(dataStore.key(["commonwords", old[0][0][dataStore.KEY].name]))
            ])
        })
        .then((r) => {
            return true;
        })
        .catch(err => {
            return false;
        })
}