import ShyButton from './shy-button'

const Panel = ({title, children, url, label, onClose}) => (
    <div className="panel panel-default">
        <div className="panel-heading">
            {onClose &&
                <span className="pull-right">
                    <ShyButton onClick={onClose}>✕</ShyButton>
                </span>
            }
            <h3 className="panel-title">
                {url ?
                    <a href={url}>{title}</a>
                :
                    title
                }
            </h3>
        </div>
        <div className="panel-body">
            {children}
            {label &&
            <a className="btn btn-default" href={url} role="button">{label}</a>
            }
        </div>
    </div>
  )

export default Panel