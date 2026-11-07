import { useRef, type KeyboardEvent } from 'react'
import { useComposerPromptSize } from './useComposerPromptSize'

type Props = {
  readonly prompt: string
  readonly locked: boolean
  readonly onPrompt: (value: string) => void
  readonly onSubmit: () => void
}

/** Growing New task prompt: one line to a six-line cap. */
export function ComposerPrompt(props: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  useComposerPromptSize(inputRef, props.prompt)

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      props.onSubmit()
    }
  }

  return (
    <>
      <label className="hd-sr" htmlFor="prompt">
        Task prompt
      </label>
      <textarea
        id="prompt"
        ref={inputRef}
        className="hd-composer__input"
        rows={1}
        placeholder="Describe the task. Use @ to mention files."
        value={props.prompt}
        disabled={props.locked}
        onChange={(event) => props.onPrompt(event.target.value)}
        onKeyDown={onKeyDown}
      />
    </>
  )
}
