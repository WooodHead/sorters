export function EntityLink({entity}) {
    return <a href={`/${entity.type}/${entity._id}`}>{entity.title}</a>
}
