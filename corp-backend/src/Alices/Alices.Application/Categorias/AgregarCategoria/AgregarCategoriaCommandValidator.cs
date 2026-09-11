using FluentValidation;

namespace Alices.Application.Categorias.AgregarCategoria;

public sealed class AgregarCategoriaCommandValidator : AbstractValidator<AgregarCategoriaCommand>
{
    public AgregarCategoriaCommandValidator()
    {
        RuleFor(x => x.Codigo)
            .NotEmpty().WithMessage("El código de categoría es obligatorio")
            .MaximumLength(20).WithMessage("El código de categoría no puede superar 20 caracteres");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre de categoría es obligatorio")
            .MaximumLength(100).WithMessage("El nombre de categoría no puede superar 100 caracteres");
    }
}
