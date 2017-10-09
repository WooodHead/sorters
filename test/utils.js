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
