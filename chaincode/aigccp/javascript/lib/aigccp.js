/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

// 数据结构
class Node {
    constructor(value) {
        this.value = value;
        this.children = []; // 存储子节点
    }
}

class DAG {
    constructor() {
        this.nodes = []; // 存储图中的所有节点
    }
  
    // 添加新节点并连接到指定的父节点
    addNode(data, parentNode = null) {
        const newNode = new Node(data);
        this.nodes.push(newNode);
        if (parentNode) {
            parentNode.children.push(newNode);
        }
        return newNode;
    }
  
    // 获取从指定节点到根节点的路径
    getPath(node) {
        const path = [];
        let current = node;
        while (current) {
            path.unshift(current.data);
            current = this.nodes.find(n => n.children.includes(current));
        }
        return path;
    }
  
    // 获取指定层级的所有节点
    getNodesAtLevel(level) {
        const nodesAtLevel = [];
        const queue = [{ node: this.nodes[0], level: 0 }];
        while (queue.length > 0) {
            const { node, level: currentLevel } = queue.shift();
            if (currentLevel === level) {
                nodesAtLevel.push(node.data);
            }
            if (currentLevel < level) {
                node.children.forEach(child => queue.push({ node: child, level: currentLevel + 1 }));
            }
        }
        return nodesAtLevel;
    }
}

// 逻辑代码
class AigcCp extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const songs = [
            {
                style: 'Pop',
                make: 'Epic',
                record: 'Thriller',
                owner: 'Michael Jackson',
            },
            {
                style: 'Rock',
                make: 'Apple',
                record: 'Hey Jude',
                owner: 'Beatles',
            },
            {
                style: 'Opera',
                make: 'BBC',
                record: 'Nessun Dorma',
                owner: 'Luciano Pavarotti',
            },
            {
                style: 'Folk',
                make: 'Sony Music',
                record: 'Blowing in the Wind',
                owner: 'Bob Dylan',
            },
            {
                style: 'Jazz',
                make: 'GRP',
                record: 'What A Wonderful World',
                owner: 'Louis Armstrong',
            },
            {
                style: 'Rap',
                make: 'Shady Records',
                record: 'Lose Yourself',
                owner: 'Eminem',
            },
            {
                style: 'Electronic',
                make: 'Universal Music',
                record: 'Waiting for Love',
                owner: 'Avicii',
            },
            {
                style: 'Metal',
                make: 'Blackened Recordings',
                record: 'Enter Sandman',
                owner: 'Metallica',
            },
            {
                style: 'New Age',
                make: 'TuneCore',
                record: 'With an Orchid',
                owner: 'Yanni',
            },
        ];

        for (let i = 0; i < songs.length; i++) {
            songs[i].docType = 'song';
            await ctx.stub.putState('SONG' + i, Buffer.from(JSON.stringify(songs[i])));
            console.info('Added <--> ', songs[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async querySong(ctx, songNumber) {
        const songAsBytes = await ctx.stub.getState(songNumber); // get the song from chaincode state
        if (!songAsBytes || songAsBytes.length === 0) {
            throw new Error(`${songNumber} does not exist`);
        }
        console.log(songAsBytes.toString());
        return songAsBytes.toString();
    }

    async createSong(ctx, songNumber, make, record, style, owner) {
        console.info('============= START : Create Song ===========');

        const song = {
            // 字段设计
            style,
            docType: 'song',
            make,
            record,
            owner,
            // 每首歌对应的simHash字段
            songHash,
            // 当前版权拥有者id信息
            songOwner,
            // 前一个版本的hash信息（用于确保可靠性，比如当前song的前一个版本是v1，那么这里就是v1对应的hash，sha256即可）
            hash,
            // TODO: 时间戳（待定）
            timestamp,
        };

        await ctx.stub.putState(songNumber, Buffer.from(JSON.stringify(song)));
        console.info('============= END : Create Song ===========');
    }

    async queryAllSongs(ctx) {
        const startKey = 'SONG0';
        const endKey = 'SONG999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Records;
                try {
                    Records = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Records = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Records });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    async changeSongOwner(ctx, songNumber, newOwner) {
        console.info('============= START : changeSongOwner ===========');

        const songAsBytes = await ctx.stub.getState(songNumber); // get the song from chaincode state
        if (!songAsBytes || songAsBytes.length === 0) {
            throw new Error(`${songNumber} does not exist`);
        }
        const song = JSON.parse(songAsBytes.toString());
        song.owner = newOwner;

        await ctx.stub.putState(songNumber, Buffer.from(JSON.stringify(song)));
        console.info('============= END : changeSongOwner ===========');
    }

    async getSimHash(ctx, songNumberA, songNumberB){
        
        //----------------One Song------------------

        // const sjs = require('simhash-js');

        // const songAsBytesA = await ctx.stub.getState(songNumberA); // get the song from chaincode state
        // if (!songAsBytesA || songAsBytesA.length === 0) {
        //     throw new Error(`${songNumberA} does not exist`);
        // }
        // const songA = JSON.parse(songAsBytesA.toString());
        
        // const simhash = new sjs.SimHash();
        // console.log('before require simhash!')

        // const x = simhash.hash(songA.record);
        // const y = simhash.hash(songA.record);
        // console.log('after require simhash!')

        // const s = sjs.Comparator.similarity(x, y); 
        
        // songA.record = s.toString();
        // await ctx.stub.putState(songNumberA, Buffer.from(JSON.stringify(songA)));

        // return s.toString();

        //----------------Two Songs-------------------

        const sjs = require('simhash-js');

        const songAsBytesA = await ctx.stub.getState(songNumberA); // get the song from chaincode state
        if (!songAsBytesA || songAsBytesA.length === 0) {
            throw new Error(`${songNumberA} does not exist`);
        }
        const songA = JSON.parse(songAsBytesA.toString());

        const songAsBytesB = await ctx.stub.getState(songNumberB); // get the song from chaincode state
        if (!songAsBytesB || songAsBytesB.length === 0) {
            throw new Error(`${songNumberB} does not exist`);
        }
        const songB = JSON.parse(songAsBytesB.toString());
        
        const simhash = new sjs.SimHash();
        console.log('before require simhash!')

        const x = simhash.hash(songA.record);
        const y = simhash.hash(songB.record);
        console.log('after require simhash!')

        const s = sjs.Comparator.similarity(x, y); 
        
        songB.record = s.toString();
        await ctx.stub.putState(songNumberB, Buffer.from(JSON.stringify(songB)));

        return s.toString();

        //----------------Create Permission-------------------

        // const sjs = require('simhash-js');

        // const songAsBytesA = await ctx.stub.getState(songNumberA); // get the song from chaincode state
        // if (!songAsBytesA || songAsBytesA.length === 0) {
        //     throw new Error(`${songNumberA} does not exist`);
        // }
        // const songA = JSON.parse(songAsBytesA.toString());
        
        // const simhash = new sjs.SimHash();
        // console.log('before require simhash!')

        // const x = simhash.hash(songNumberA);
        // const isTheSame = 0;

        // const startKey = 'SONG0';
        // const endKey = 'SONG999';

        // const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        // while (true) {
        //     const res = await iterator.next();

        //     if (res.value && res.value.value.toString() && sjs.Comparator.similarity(x, simhash.hash(res.value.key)) == 1) {
        //         isTheSame = 1;
        //         songA.record = isTheSame.toString();
        //         await ctx.stub.putState(songNumberA, Buffer.from(JSON.stringify(songA)));
        //     }

        //     if (res.done) {
        //         console.log('end of data');
        //         await iterator.close();
        //     }

        // }

    }

}

module.exports = AigcCp;
