import Markdown from './markdown'
import {compose} from 'recompose'
import React from 'react'
import gql from 'graphql-tag'
import {withUser} from 'ooth-client-react'
import {errorMessage} from '../utils/errors'
import {graphql} from 'react-apollo'
import Form from 'staart/lib/components/form'
import Gravatar from 'react-gravatar'
import ShyButton from '../components/shy-button'
import DeleteModal from '../components/delete-modal'
import {username} from './user'

function CommentsComponent({user, comments, entityType, entityId, onNewComment, onChangeComment, onDeleteComment, title, commentLabel, submitCommentLabel}) {
    return <div>
        <h2>{title || 'Comments'}</h2>
        {user ?
            (username(user) ?
                <CommentForm entityType={entityType} entityId={entityId} user={user} onNewComment={onNewComment} label={commentLabel} submitLabel={submitCommentLabel}/>
            :
                <div className="alert alert-info">
                    <p>
                        Set a <a href="/account/account" style={{ fontWeight: 'bold' }}>username</a> to leave a comment.
                    </p>
                </div>
            )
        :
            <div className="alert alert-info">
                <p>
                    <a href={`/login?next=${encodeURIComponent(`/${entityType}/${entityId}`)}`} style={{ fontWeight: 'bold' }}>Log in</a> or <a href={`/register?next=${encodeURIComponent(`/${entityType}/${entityId}`)}`} style={{ fontWeight: 'bold' }}>register</a> to leave a comment.
                </p>
            </div>
        }
        {comments.map(comment => <Comment
            key={comment._id}
            comment={comment}
            user={user}
            onChangeComment={onChangeComment}
            onDeleteComment={onDeleteComment}
        />)}
    </div>
}
const Comments = compose(
    withUser,
)(CommentsComponent)

export default Comments


function User({user, children, actions}) {
    const username = user && user.local && user.local.username
    const hash = user && user.emailHash || username
    const name = (user && user.profile && user.profile.name) || (username && `/u/${username}`)
    
    if (!username) {
        return null
    }

    return <div style={{
        display: 'flex',
    }}>
        <Gravatar md5={hash} size={48} style={{
            marginTop: '.5rem',
            marginRight: '1.5rem',
        }}/>
        <div style={{
            flexGrow: 1
        }}>
            {actions &&
                <div style={{
                    display: 'block',
                    float: 'right',
                }}>{actions}</div>
            }
            <a href={`/u/${username}`}>{name}</a>
            {children}
        </div>
    </div>
}


const UpdateCommentQuery = gql`
    mutation($comment: CommentInput!) {
        updateComment(comment: $comment) {
            _id
        }
    }
`
const DeleteCommentQuery = gql`
    mutation($commentId: ID!) {
        deleteComment(_id: $commentId) {
            _id
        }
    }
`
class CommentComponent extends React.Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {user, comment: {user: commentUser, _id, content, deleted}, onChangeComment, updateComment, onDeleteComment, deleteComment} = this.props
        if (this.state.edit) {
            return <Form
                onSubmit={() => {
                    const comment = {
                        _id,
                        content: this.content.value,
                    }
                    updateComment({
                        variables: {
                            comment
                        }
                    }).then(() => {
                        this.setState({
                            edit: false,
                        })
                        onChangeComment()
                    }).catch(e => {
                        this.setState({
                            state: 'error',
                            message: errorMessage(e),
                        })
                    })
                }}
                state={this.state.state}
                message={this.state.message}
                submitLabel="Save"
            >
                <span
                    style={{
                        display: 'block',
                        float: 'right',
                    }}
                >
                    <ShyButton
                        onClick={() => {
                            this.setState({
                                edit: false,
                            })
                        }}
                    >✕</ShyButton>{' '}
                </span>
                <div className="form-group">
                    <label htmlFor="content">Comment</label>
                    <textarea
                        className="form-control"
                        rows="4"
                        ref={ref => this.content = ref}
                        defaultValue={content}
                    />
                </div>
            </Form>
        } else {
            return <User user={commentUser} actions={
                !deleted && user && user._id === commentUser._id && <span>
                    <DeleteModal
                        title="Delete comment?"
                        message="A deleted comment can't be recovered."
                        onDelete={() => {
                            deleteComment({
                                variables: {
                                    commentId: _id,
                                }
                            }).then(onDeleteComment)
                        }}/>
                    <ShyButton onClick={() => {
                        this.setState({
                            edit: true
                        })
                    }}>✎</ShyButton>
                </span>
            }>
                {deleted ?
                    <div style={{
                        fontStyle: 'italic'
                    }}>[deleted]</div>
                :
                    <Markdown content={content}/>
                }
            </User>
        }
    }
}
export const Comment = compose(
    graphql(UpdateCommentQuery, {
        name: 'updateComment',
    }),
    graphql(DeleteCommentQuery, {
        name: 'deleteComment',
    }),
)(CommentComponent)

const CreateCommentQuery = gql`
    mutation($comment: NewCommentInput!) {
        createComment(comment: $comment) {
            _id
        }
    }
`
class CommentFormComponent extends React.Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {createComment, onNewComment, entityType, entityId, label, submitLabel} = this.props
        return <Form
            onSubmit={() => {
                const comment = {
                    entityType,
                    entityId,
                    content: this.content.value,
                }
                createComment({
                    variables: {
                        comment,
                    }
                }).then(() => {
                    this.content.value = ''
                }).then(onNewComment)
                .catch(e => {
                    this.setState({
                        state: 'error',
                        message: errorMessage(e),
                    })
                })
            }}
            state={this.state.state}
            message={this.state.message}
            submitLabel={submitLabel || 'Send Comment'}
        >
            <div className="form-group">
                <label htmlFor="content">{label || 'Comment'}</label>
                <textarea
                    className="form-control"
                    rows="4"
                    ref={ref => this.content = ref}
                />
            </div>
        </Form>
    }
}
const CommentForm = compose(
    graphql(CreateCommentQuery, {
        name: 'createComment'
    }),
)(CommentFormComponent)
