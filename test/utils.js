import _pretty from 'pretty'

export const sleep = async (millis) => new Promise((resolve) => setTimeout(resolve, millis))

export const request = async (page, uri, operation, data) => {
    await page.setRequestInterception(true)
    page.once('request', interceptedRequest => {
        interceptedRequest.continue({
            method: operation,
            postData: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            },
        })
    })
    const response = await page.goto(uri)
    await page.setRequestInterception(false)
    if (response.status() !== 200) {
        throw new Error(`Couldn't open page ${uri}: ${response.status()}`)
    }
    return JSON.parse(await response.text())
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