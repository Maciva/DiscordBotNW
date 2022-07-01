const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient()

async function find(id){
    return await prisma.server.findUnique({
        where: {
            id: id
        }
    })
}

async function create(server){
    return await prisma.server.create({data: server})
}

async function save(server){
    return await prisma.server.update({
        data: server,
        where: {
            id: server.id
        }
    })
}


exports.find = find;
exports.create = create;
exports.save = save;