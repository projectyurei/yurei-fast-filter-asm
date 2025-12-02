const { Connection, Keypair, Transaction, TransactionInstruction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

describe('Yurei Fast Filter Assembly', () => {
    let connection;
    let payer;
    let programId;

    const PROGRAM_KEYPAIR_PATH = path.resolve(__dirname, '../dist/filter-keypair.json');

    const PAYER_KEYPAIR_PATH = path.resolve(__dirname, '../payer.json');

    before(async () => {
        // Connect to local validator
        connection = new Connection('http://127.0.0.1:8899', 'confirmed');

        // Load Payer
        if (fs.existsSync(PAYER_KEYPAIR_PATH)) {
            const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(PAYER_KEYPAIR_PATH, 'utf8')));
            payer = Keypair.fromSecretKey(secretKey);
            console.log("Using loaded payer:", payer.publicKey.toBase58());
        } else {
            payer = Keypair.generate();
            console.log("Generated new payer:", payer.publicKey.toBase58());
            const signature = await connection.requestAirdrop(payer.publicKey, 1000000000); // 1 SOL
            await connection.confirmTransaction(signature);
        }

        // Load Program Keypair
        if (!fs.existsSync(PROGRAM_KEYPAIR_PATH)) {
            throw new Error(`Program keypair not found at ${PROGRAM_KEYPAIR_PATH}. Please build and deploy first.`);
        }
        const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(PROGRAM_KEYPAIR_PATH, 'utf8')));
        const programKeypair = Keypair.fromSecretKey(secretKey);
        programId = programKeypair.publicKey;

        console.log("Testing Program ID:", programId.toBase58());
    });

    it('should detect "YUREI" pattern and return 1 (simulated failure with log)', async () => {
        // Construct data containing "YUREI" (0x59, 0x55, 0x52, 0x45, 0x49)
        // Let's put it in the middle of some random bytes
        const data = Buffer.from([0x01, 0x02, 0x59, 0x55, 0x52, 0x45, 0x49, 0x03, 0x04]);

        const instruction = new TransactionInstruction({
            keys: [],
            programId,
            data,
        });

        const transaction = new Transaction().add(instruction);

        try {
            await sendAndConfirmTransaction(connection, transaction, [payer]);
            // If it succeeds (return 0), it means pattern was NOT found (based on our logic: Found=1, NotFound=0)
            // So if we expect it to be found, we expect a return code of 1, which causes a Tx Error.
            throw new Error("Transaction succeeded but should have failed with return code 1 (Pattern Found)");
        } catch (err) {
            // We expect an error due to return code 1
            if (err.message.includes("Transaction succeeded")) {
                throw err;
            }

            // Check logs
            const logs = err.logs || [];
            const foundLog = logs.some(log => log.includes("Pattern Found"));
            expect(foundLog).to.be.true;

            // Log CU
            const cuLog = logs.find(log => log.includes("consumed"));
            if (cuLog) {
                console.log("      [Perf] " + cuLog);
            }
        }
    });

    it('should NOT detect pattern and return 0 (success)', async () => {
        // Data without "YUREI"
        const data = Buffer.from([0x01, 0x02, 0x59, 0x55, 0x00, 0x45, 0x49, 0x03, 0x04]); // 'R' replaced by 0x00

        const instruction = new TransactionInstruction({
            keys: [],
            programId,
            data,
        });

        const transaction = new Transaction().add(instruction);

        // Should succeed (return 0)
        const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
        expect(signature).to.be.a('string');

        // Fetch logs to confirm NO "Pattern Found"
        const tx = await connection.getTransaction(signature, { commitment: 'confirmed' });
        const logs = tx.meta.logMessages || [];
        const foundLog = logs.some(log => log.includes("Pattern Found"));
        expect(foundLog).to.be.false;

        // Log CU
        const cuLog = logs.find(log => log.includes("consumed"));
        if (cuLog) {
            console.log("      [Perf] " + cuLog);
        }
    });
});
