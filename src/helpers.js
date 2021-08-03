function findNearest(arr, needle, getter = el => el) {
	let prevEl
	for (const el of arr) {
		if (getter(el) > needle) {
			if (prevEl && getter(el) - needle > needle - getter(prevEl)) {
				return prevEl
			} else {
				return el
			}
		}
		prevEl = el
	}
	return prevEl
}

async function callWithRetry(func, args, maxTries = 10) {
  let i = 0
  while (true) {
    try {
      return await func(...args)
    } catch (ex) {
      i++
      if (i == maxTries) {
        throw ex
      }
    }
  }
}

async function queryProviderLogs({ provider, fromBlock, toBlock, address, backwards }) {
  console.log(`query logs fromBlock=%s toBlock=%s blocks length=%s backwards=%s`,
  	fromBlock,
  	toBlock,
  	toBlock - fromBlock,
  	backwards
  )
  const allResult = []
  const MAX = 1000

  let chunkFromBlock
  let chunkToBlock

  if (backwards) {
  	chunkToBlock = toBlock
  	chunkFromBlock = Math.max(fromBlock, toBlock - MAX)
  } else {
	  chunkFromBlock = fromBlock
	  chunkToBlock = Math.min(toBlock, fromBlock + MAX)
  }

  let i = 0
  while (true) {
    console.log(`requesting ${i} chunk ${chunkFromBlock}-${chunkToBlock}...`)
    try {
      let result = await callWithRetry(provider.getLogs.bind(provider), [{
        fromBlock: chunkFromBlock,
        toBlock: chunkToBlock,
        address
      }])
      if (backwards) {
      	result = result.reverse()
      }
      allResult.push(...result)
    } catch (ex) {
      console.log(`chunk ${i} failed. break`)
      console.error(ex.message)
      break
    }
    i++

    if (!backwards && chunkToBlock === toBlock) {
      console.log('done')
      break
    }
    if (backwards && chunkFromBlock === fromBlock) {
      console.log('done')
      break
    }

    if (backwards) {
	    chunkToBlock = chunkFromBlock - 1
	    chunkFromBlock = Math.max(fromBlock, chunkFromBlock - MAX)
    } else {
	    chunkFromBlock = chunkToBlock + 1
	    chunkToBlock = Math.min(toBlock, chunkToBlock + MAX)
    }
  }

  return allResult
}

module.exports = {
	findNearest,
	callWithRetry,
	queryProviderLogs
}