import {
  useForm,
  useWatch,
  useFieldArray,
  type SubmitHandler,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  questionFormSchema,
  type QuestionFormValues,
} from "../schemas/questionSchema.ts";
import { type CreateQuestionInput } from "@x02/shared";
import { createQuestion } from "../api/questions.ts";
import {
  toCreateQuestionPayload,
  toFormFieldName,
} from "../api/questionMapper.ts";
import { ApiError } from "../api/client.ts";
import { useNavigate } from "react-router";

type MultipleChoiceValues = Extract<
  QuestionFormValues,
  { answerType: "MULTIPLE_CHOICE" }
>;
type ShortAnswerValues = Extract<
  QuestionFormValues,
  { answerType: "SHORT_ANSWER" }
>;

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

export default function NewQuestionForm() {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    mode: "onTouched",
    defaultValues: {
      category: "",
      answerType: "MULTIPLE_CHOICE",
      questionText: "",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  });

  const navigate = useNavigate();

  const optionErrors = (errors as FieldErrors<MultipleChoiceValues>).options;
  const modelAnswerError = (errors as FieldErrors<ShortAnswerValues>)
    .modelAnswer;

  const answerType = useWatch({ control, name: "answerType" });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });
  const onSubmit: SubmitHandler<QuestionFormValues> = async (data) => {
    const request: CreateQuestionInput = toCreateQuestionPayload(data);

    try {
      await createQuestion(request);
      navigate("/admin/questions");
    } catch (error) {
      if (error instanceof ApiError) {
        // input field error
        if (error.fieldErrors.length > 0) {
          let hasHandledFieldError = false;

          for (const { field, message } of error.fieldErrors) {
            const formField = toFormFieldName(field);

            if (formField) {
              setError(
                formField as FieldPath<QuestionFormValues>,
                { type: "server", message },
                { shouldFocus: !hasHandledFieldError },
              );
              hasHandledFieldError = true;
            }
          }
          if (hasHandledFieldError) return;
        }
        // form-level error
        setError("root.server", {
          type: String(error.status),
          message: error.message,
        });

        return;
      }

      // network error
      setError("root.server", {
        type: "network",
        message: "Couldn't reach the server. Please try again.",
      });
    }
  };

  function onCancel() {
    navigate("/admin/questions");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-5"
      noValidate
    >
      {/* Category and Answer inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="label">
            Category
          </label>

          <select
            id="category"
            {...register("category")}
            aria-invalid={!!errors.category}
            aria-describedby="category-error"
            className="field focus-ring"
          >
            <option value="">Select a category</option>
            <option value="PSM">PSM</option>
            <option value="PSPO">PSPO</option>
          </select>

          {errors?.category && (
            <p
              id="category-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="answerType" className="label">
            Answer type
          </label>

          <select
            id="answerType"
            {...register("answerType")}
            aria-invalid={!!errors.answerType}
            aria-describedby="answerType-error"
            className="field focus-ring"
          >
            <option value="MULTIPLE_CHOICE">Multiple choice</option>
            <option value="SHORT_ANSWER">Short answer</option>
          </select>

          {errors?.answerType && (
            <p
              id="answerType-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.answerType.message}
            </p>
          )}
        </div>
      </div>

      {/* Question text input */}
      <div>
        <label htmlFor="questionText" className="label">
          Question text
        </label>

        <textarea
          id="questionText"
          {...register("questionText")}
          aria-invalid={!!errors.questionText}
          aria-describedby="questionText-error"
          rows={5}
          placeholder="Write your question here..."
          className="field focus-ring"
        ></textarea>

        {errors?.questionText && (
          <p
            id="questionText-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.questionText.message}
          </p>
        )}
      </div>

      {/* Multiple choice fields */}
      {answerType === "MULTIPLE_CHOICE" ? (
        <fieldset className="space-y-2">
          <legend className="label">
            Answer options (tick the correct ones)
          </legend>

          {fields.map((field, index) => {
            const letter = String.fromCharCode(65 + index);

            // TODO: re-validate options.root when a checkbox changes (register deps / trigger)
            return (
              <div key={field.id}>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register(`options.${index}.isCorrect`)}
                    aria-label={`Option ${letter} is correct`}
                    className="size-5 shrink-0 focus-ring"
                  />
                  <input
                    type="text"
                    {...register(`options.${index}.text`)}
                    aria-label={`Option ${letter} text`}
                    aria-invalid={!!optionErrors?.[index]?.text}
                    placeholder={`Option ${letter}`}
                    className="field focus-ring"
                  />
                  <button
                    type="button"
                    aria-label={`Remove option ${letter}`}
                    disabled={fields.length <= MIN_OPTIONS}
                    onClick={() => remove(index)}
                    className="rounded-md border border-line-strong bg-page px-3 py-2 text-fg hover:bg-surface disabled:opacity-40 focus-ring"
                  >
                    x
                  </button>
                </div>

                {optionErrors?.[index]?.text && (
                  <p role="alert" className="text-sm text-red-600">
                    {optionErrors[index].text.message}
                  </p>
                )}
              </div>
            );
          })}

          {/* Array-level errors */}
          {optionErrors?.root && (
            <p role="alert" className="text-sm text-red-600">
              {optionErrors.root.message}
            </p>
          )}

          {/* Add option */}
          <button
            type="button"
            disabled={fields.length >= MAX_OPTIONS}
            onClick={() => append({ text: "", isCorrect: false })}
            className="text-sm font-medium text-accent-fg hover:underline disabled:opacity-40 focus-ring"
          >
            + Add option
          </button>
        </fieldset>
      ) : (
        // Short answer fields
        <div>
          <label htmlFor="modelAnswer" className="label">
            Model answer
          </label>

          <textarea
            id="modelAnswer"
            {...register("modelAnswer")}
            aria-invalid={!!modelAnswerError}
            aria-describedby="modelAnswer-error"
            rows={3}
            placeholder="What would a correct answer look like?"
            className="field focus-ring"
          />

          {modelAnswerError && (
            <p
              id="modelAnswer-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {modelAnswerError.message}
            </p>
          )}
        </div>
      )}

      {errors.root?.server && (
        <p className="text-sm text-red-600" role="alert">
          {errors.root.server.message}
        </p>
      )}

      {/* Form actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md border border-accent-line bg-accent-soft px-4 py-2 font-medium text-accent-fg hover:bg-accent-line/50 focus-ring"
        >
          Submit question
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 font-medium border-line-strong bg-page text-fg hover:bg-surface focus-ring"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
