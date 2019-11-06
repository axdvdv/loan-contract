const Contract = artifacts.require("LoanContract")
const {
    signMessage,
    LoanToObject
} = require('./helpers');

contract('test', (accounts) => {

    let contract
    let owner = accounts[0]
    let user = accounts[1]
    let sponsor = accounts[2]


    before('init contract', async () => {
        contract = await Contract.deployed()
    })

    describe('case 1: request -> approve -> take', () => {

        let id = ''
        const amount = web3.utils.toWei('1')
        const ttl = 100 // in blocks
        let userInitBalance
        let ownerInitBalance



        it('init balance', async () => {
            userInitBalance = await web3.eth.getBalance(user)
            ownerInitBalance = await web3.eth.getBalance(owner)
        })

        it('should create a request', async () => {
            const currentBlock = await web3.eth.getBlockNumber()
            const tx = await contract.requestLoan(amount, currentBlock + ttl, {
                from: user
            })
            id = tx.logs[0].args.RequestId

            const loan = LoanToObject(await contract.Loans.call(id))

            const state = {
                amount: amount,
                receiver: user,
                ttl: (currentBlock + ttl).toString(),
                status: 'Created',
            }

            assert.deepEqual(loan, state, 'inccorect loan state')

        })

        it('should approve a request', async () => {
            await contract.approveLoan(id, {
                from: owner,
                value: amount
            })

            const contractBalance = await web3.eth.getBalance(contract.address)
            const ownerActualBalance = await web3.eth.getBalance(owner)
            const loan = LoanToObject(await contract.Loans.call(id))

            assert.equal(contractBalance, amount)
            assert.isOk(ownerActualBalance < '' + (ownerInitBalance - amount))
            assert.equal(loan.status, 'Approved', 'inccorect loan state')

        })

        it('should take a loan', async () => {

            await contract.takeLoan(id, {
                from: user
            })

            const contractBalance = await web3.eth.getBalance(contract.address)
            const userActualBalance = await web3.eth.getBalance(user)
            const loan = LoanToObject(await contract.Loans.call(id))

            assert.equal(contractBalance, 0)
            assert.isOk(userActualBalance > userInitBalance)
            assert.equal(loan.status, 'Completed', 'inccorect loan state')

        })
    })

    describe('case 2: request -> approve -> refuse', () => {
        let id = ''
        const amount = web3.utils.toWei('1')
        const ttl = 100 // in blocks
        let ownerInitBalance


        it('init balance', async () => {
            userInitBalance = await web3.eth.getBalance(user)
            ownerInitBalance = await web3.eth.getBalance(owner)
        })

        it('should create a request', async () => {
            const currentBlock = await web3.eth.getBlockNumber()
            const tx = await contract.requestLoan(amount, currentBlock + ttl, {
                from: user
            })
            id = tx.logs[0].args.RequestId

            const loan = LoanToObject(await contract.Loans.call(id))

            const state = {
                amount: amount,
                receiver: user,
                ttl: (currentBlock + ttl).toString(),
                status: 'Created',
            }

            assert.deepEqual(loan, state, 'inccorect loan state')

        })

        it('should approve a request', async () => {
            await contract.approveLoan(id, {
                from: owner,
                value: amount
            })

            const contractBalance = await web3.eth.getBalance(contract.address)
            const ownerActualBalance = await web3.eth.getBalance(owner)
            const loan = LoanToObject(await contract.Loans.call(id))

            assert.equal(contractBalance, amount)
            assert.isOk(ownerActualBalance < '' + (ownerInitBalance - amount))
            assert.equal(loan.status, 'Approved', 'inccorect loan state')

        })

        it('should refuse a loan', async () => {

            const ownerPreviousBalance = await web3.eth.getBalance(owner)

            await contract.refuseLoan(id, {
                from: user
            })

            const contractBalance = await web3.eth.getBalance(contract.address)
            const ownerActualBalance = await web3.eth.getBalance(owner)
            const loan = LoanToObject(await contract.Loans.call(id))
            assert.equal(contractBalance, 0)
            assert.equal(ownerActualBalance, parseInt(ownerPreviousBalance) + parseInt(amount), 'invalid owner balance')
            assert.equal(loan.status, 'Refused', 'inccorect loan state')

        })
    })

    describe('case 3: request -> cancel', () => {
        let id = ''
        const amount = web3.utils.toWei('1')
        const ttl = 100 // in blocks

        it('should create a request', async () => {
            const currentBlock = await web3.eth.getBlockNumber()
            const tx = await contract.requestLoan(amount, currentBlock + ttl, {
                from: user
            })
            id = tx.logs[0].args.RequestId

            const loan = LoanToObject(await contract.Loans.call(id))
            assert.equal(loan.status, 'Created')

        })

        it('should cancel a request', async () => {
            await contract.cancelLoan(id, {
                from: owner
            })

            const loan = LoanToObject(await contract.Loans.call(id))
            assert.equal(loan.status, 'Canceled')

        })
    })

    describe('case 4: sponsor request -> approve -> sponsor take', () => {

        let id = ''
        const amount = web3.utils.toWei('1')
        const ttl = 100 // in blocks
        let userInitBalance
        let ownerInitBalance


        it('init balance', async () => {
            userInitBalance = await web3.eth.getBalance(user)
            ownerInitBalance = await web3.eth.getBalance(owner)
        })

        it('should create a request by sponsor', async () => {
            const currentBlock = await web3.eth.getBlockNumber()

            const hash = web3.utils.soliditySha3({
                t: 'uint256',
                v: (amount).toString()
            }, {
                t: 'uint256',
                v: (currentBlock + ttl).toString()
            })

            signature = await signMessage(user, hash)

            const tx = await contract.sponsorshipRequestLoan(amount, currentBlock + ttl, user, signature, {
                from: sponsor
            })

            id = tx.logs[0].args.RequestId

            const loan = LoanToObject(await contract.Loans.call(id))

            const state = {
                amount: amount,
                receiver: user,
                ttl: (currentBlock + ttl).toString(),
                status: 'Created',
            }

            assert.deepEqual(loan, state, 'inccorect loan state')

        })

        it('should approve a request', async () => {
            await contract.approveLoan(id, {
                from: owner,
                value: amount
            })

            const contractBalance = await web3.eth.getBalance(contract.address)
            const ownerActualBalance = await web3.eth.getBalance(owner)
            const loan = LoanToObject(await contract.Loans.call(id))

            assert.equal(contractBalance, amount)
            assert.isOk(ownerActualBalance < '' + (ownerInitBalance - amount))
            assert.equal(loan.status, 'Approved', 'inccorect loan state')

        })

        it('should take a loan by sponsor', async () => {

            const funcSig = web3.eth.abi.encodeFunctionSignature('takeLoan(bytes32)')

            const hash = web3.utils.soliditySha3({
                t: 'bytes4',
                v: funcSig
            }, {
                t: 'bytes32',
                v: id
            })

            signature = await signMessage(user, hash)



            await contract.sponsorshipTakeLoan(id, user, signature, {
                from: sponsor
            })

            const contractBalance = await web3.eth.getBalance(contract.address)
            const userActualBalance = await web3.eth.getBalance(user)
            const loan = LoanToObject(await contract.Loans.call(id))

            assert.equal(contractBalance, 0)
            assert.isOk(userActualBalance > userInitBalance)
            assert.equal(loan.status, 'Completed', 'inccorect loan state')

        })
    })

    describe('case 5: sponsor request -> approve -> sponsor refuse', () => {

        let id = ''
        const amount = web3.utils.toWei('1')
        const ttl = 100 // in blocks
        let ownerInitBalance


        it('init balance', async () => {
            userInitBalance = await web3.eth.getBalance(user)
            ownerInitBalance = await web3.eth.getBalance(owner)
        })

        it('should create a request by sponsor', async () => {
            const currentBlock = await web3.eth.getBlockNumber()

            const hash = web3.utils.soliditySha3({
                t: 'uint256',
                v: (amount).toString()
            }, {
                t: 'uint256',
                v: (currentBlock + ttl).toString()
            })

            signature = await signMessage(user, hash)


            const tx = await contract.sponsorshipRequestLoan(amount, currentBlock + ttl, user, signature, {
                from: sponsor
            })

            id = tx.logs[0].args.RequestId

            const loan = LoanToObject(await contract.Loans.call(id))

            const state = {
                amount: amount,
                receiver: user,
                ttl: (currentBlock + ttl).toString(),
                status: 'Created',
            }

            assert.deepEqual(loan, state, 'inccorect loan state')

        })

        it('should approve a request', async () => {
            await contract.approveLoan(id, {
                from: owner,
                value: amount
            })

            const contractBalance = await web3.eth.getBalance(contract.address)
            const ownerActualBalance = await web3.eth.getBalance(owner)
            const loan = LoanToObject(await contract.Loans.call(id))

            assert.equal(contractBalance, amount)
            assert.isOk(ownerActualBalance < '' + (ownerInitBalance - amount))
            assert.equal(loan.status, 'Approved', 'inccorect loan state')

        })

        it('should refuse a loan by sponsor', async () => {

            const ownerPreviousBalance = await web3.eth.getBalance(owner)

            const funcSig = web3.eth.abi.encodeFunctionSignature('refuseLoan(bytes32)')

            const hash = web3.utils.soliditySha3({
                t: 'bytes4',
                v: funcSig
            }, {
                t: 'bytes32',
                v: id
            })

            signature = await signMessage(user, hash)

            await contract.sponsorshipRefuseLoan(id, user, signature, {
                from: sponsor
            })

            const contractBalance = await web3.eth.getBalance(contract.address)
            const ownerActualBalance = await web3.eth.getBalance(owner)
            const loan = LoanToObject(await contract.Loans.call(id))

            assert.equal(contractBalance, 0)
            assert.equal(ownerActualBalance, parseInt(ownerPreviousBalance) + parseInt(amount), 'invalid owner balance')
            assert.equal(loan.status, 'Refused', 'inccorect loan state')

        })
    })

})