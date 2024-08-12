const fs = require("fs");


function toUnixMills(timeString) {
    return new Date(timeString).getTime();
}

function* messageTimeStream(importPath) {
    
    // Read all files into an array of channels, where each channel is an array
    // of messages.
    let channels = [];
    fs.readdirSync(importPath).forEach((file) => {
        channels.push(JSON.parse(fs.readFileSync(importPath + file)).messages);
    });

    let earliestMessageTime = 8640000000000000;
    let thisMessageTime = 0;
    let earliestMessageChannel = 0;

    // While at least one channel still has messages.
    while (channels.some((ch) => { return ch.length !== 0; })) {
        
        earliestMessageTime = 8640000000000000;

        // Pick earliest message between the first message in every channel..
        // Since Discord stores them chronologically, the first message of
        // the channel is the earliest in that channel.
        for (let i = 0; i < channels.length; i++) {
            // Skip channels with no messages left.
            if (channels[i].length == 0) continue;
            thisMessageTime = toUnixMills(channels[i][0].timestamp);
            if (thisMessageTime < earliestMessageTime) {
                earliestMessageTime = thisMessageTime;
                earliestMessageChannel = i;
            }
        }
        
        // Delete the earliest found message, and then repeat the process. This
        // essentially joins individual channel message streams into one.
        channels[earliestMessageChannel].shift();

        // SANITY CHECK: Only for use when testing my own level.
        // Ignore all messages after I got LV100 but before I got reset.
        if (
            importPath == ("REDACTED") &&
            earliestMessageTime < (new Date("2024-06-08T15:44:39.767Z").getTime())
        ) continue;
        
        yield earliestMessageTime;
    }
}

function eligibleMessageCount(timeStream) {
    let eligibleMessageTime = timeStream.next();
    let eligibleMessageCount = 0;
    let timeDelta = 0;

    // If delta is more than a minute, add to count, update last eligible
    // message. If not, skip.
    for (let thisMessageTime of timeStream) {
        timeDelta = thisMessageTime - eligibleMessageTime;
        if (timeDelta < oneMinute) continue;
        eligibleMessageTime = thisMessageTime;
        eligibleMessageCount++;
    }

    return eligibleMessageCount;
}

const oneMinute = 60000; 
const averageXP = 26;

console.log(averageXP * eligibleMessageCount(messageTimeStream()));