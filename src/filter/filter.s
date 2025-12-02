.globl entrypoint
.extern sol_log_

entrypoint:
    // r1 holds the pointer to the serialized parameters
    // Format (assuming 0 accounts):
    // [0-7]: num_accounts (u64)
    // [8-15]: instruction_data_len (u64)
    // [16+]: instruction_data (bytes)

    // 1. Check num_accounts (must be 0 for this optimized filter)
    ldxdw r0, [r1+0]
    jne r0, 0, not_found // If accounts > 0, just exit (simplification)

    // 2. Load data length
    ldxdw r3, [r1+8]    // r3 = data_len

    // 3. Set data pointer
    mov64 r2, r1
    add64 r2, 16        // r2 = start of data

    // 4. Safety check: if data_len < 5 ("YUREI"), exit
    jlt r3, 5, not_found

    // 5. Adjust loop limit
    // We want to stop when r4 > (data_len - 5)
    // But for simplicity, we'll just check bounds inside or use the counter
    // r3 holds the total length.
    // Let's use r4 as the current offset (0 to data_len)
    mov64 r4, 0

scan_loop:
    // Check if we have enough bytes left (5 bytes needed)
    // if (r4 + 5 > r3) goto not_found
    mov64 r0, r4
    add64 r0, 5
    jgt r0, r3, not_found

    ldxb r5, [r2+0]     // load byte at current pointer
    jeq r5, 0x59, check_u // if byte == 'Y' (0x59), check next bytes
    
    add64 r2, 1           // increment pointer
    add64 r4, 1           // increment counter
    ja scan_loop        // jump always (loop)

check_u:
    // Check 'U' (0x55)
    ldxb r5, [r2+1]
    jne r5, 0x55, resume_scan

    // Check 'R' (0x52)
    ldxb r5, [r2+2]
    jne r5, 0x52, resume_scan

    // Check 'E' (0x45)
    ldxb r5, [r2+3]
    jne r5, 0x45, resume_scan

    // Check 'I' (0x49)
    ldxb r5, [r2+4]
    jne r5, 0x49, resume_scan

    // Pattern Found!
    // Log "Pattern Found"
    lddw r1, success_msg  // r1 = address of message
    mov64 r2, 13          // r2 = length of "Pattern Found"
    call sol_log_

    // Return 1 (Success as per user requirement)
    mov64 r0, 1
    exit

resume_scan:
    add64 r2, 1           // increment pointer
    add64 r4, 1           // increment counter
    ja scan_loop

not_found:
    // Return 0
    mov64 r0, 0
    exit

.rodata
success_msg:
    .ascii "Pattern Found"
