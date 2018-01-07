import CheckButtons from './check-buttons'
import {toObject} from '../utils/objects'

export default ({label, id, entities, defaultEntityIds, checksRef}) => {
    return <CheckButtons
        label={label}
        id={id}
        values={toObject(entities.map(({_id, title}) => [_id, { label: title, default: defaultEntityIds && defaultEntityIds.indexOf(_id) > -1}]))}
        ref={checksRef}
    />
}
