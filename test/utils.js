import _pretty from 'pretty'

export const sleep = async (millis) => new Promise((resolve) => setTimeout(resolve, millis))

export const request = async (page, uri, operation, data) => {
    const status = await page.open(
        uri,
        {
            operation,
            encoding: 'utf8',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        }
    )
    if (status !== 'success') {
        throw new Error(`Couldn't open page: ${status}`)
    }
    return JSON.parse(await page.property('plainText'))
}

export function pretty(str) {

    str = _pretty(str)

    str = str.replace(/ data-react-checksum="-?\d+"/g, '')
    str = str.replace(/ data-reactid="\d+"/g, '')
    str = str.replace(/<!-- react-text: \d+ -->/g, '')
    str = str.replace(/ *<!-- \/react-text -->\n/g, '')
    str = str.replace(/\b\w{24}\b/g, '<id>')
    str = str.replace(/\n *<!-- +-->/g, ' ')
    str = str.replace(/ *<!-- +-->/g, '')

    return str
}