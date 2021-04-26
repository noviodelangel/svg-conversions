const data: any[] =     []

export function sos() {
    // console.log('SOS')

    for ( let row of data ) {
        let line = ''
        line += row.id  + ';'
        line += row.created_date_time + ';'
        line += JSON.stringify(row.status) + ';'
        line += JSON.stringify(row.reference) + ';'
        line += JSON.stringify(row.name) + ';'
        line += JSON.stringify(row.address) + ';'
        line += JSON.stringify(row.address.line_1 ?? '') + ';'
        line += JSON.stringify(row.address.line_2 ?? '') + ';'
        line += JSON.stringify(row.address.line_3 ?? '') + ';'
        line += JSON.stringify(row.bank_account) + ';'
        line += JSON.stringify(row.bank_account.number ?? '') + ';'
        line += JSON.stringify(row.bank_account.owner ?? '') + ';'
        line += JSON.stringify(row.bank_account.currency ?? '') + ';'
        line += JSON.stringify(row.bank_account.bank ?? '') + ';'
        line += JSON.stringify(row.bank_account.bank?.name ?? '') + ';'
        line += JSON.stringify(row.bank_account.bank?.country ?? '') + ';'
        line += JSON.stringify(row.bank_account.bank?.bic ?? '') + ';'
        line += JSON.stringify(row.bank_account.bank?.code ?? '') + ';'
        line += JSON.stringify(row.type) + ';'
        line += JSON.stringify(row.default_transfer_reason)
        console.log(line)
    }
    // console.log(JSON.stringify(data[0].name))

    for ( let key in data[0].name) {
        // console.log(key)
    }
}
