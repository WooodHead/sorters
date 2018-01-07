export default ({label, entities, type}) => {
    if (!entities.length) {
        return null
    }
    return <div>
        {label}{' '}{entities.map(({_id, title}, i) => (
            <span key={i}>{i ? ', ' : ' '}<a href={`/${type}/${_id}`}>{title}</a></span>                                
        ))}
    </div>
}