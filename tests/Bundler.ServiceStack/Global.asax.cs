using System;
using System.Collections.Generic;
using System.Linq;
using Funq;
using ServiceStack.Razor;
using ServiceStack.ServiceHost;
using ServiceStack.ServiceInterface;
using ServiceStack.Text;
using ServiceStack.WebHost.Endpoints;

namespace Bootstrap.ServiceStack
{
    public class AppHost : AppHostBase
    {
        public AppHost() : base("Test Bundler", typeof(TodoService).Assembly) { }

        public override void Configure(Container container)
        {
            JsConfig.EmitCamelCaseNames = true;

            Plugins.Add(new RazorFormat());
        }
    }

    [Route("/todos")]
    [Route("/todos/{Id}")]
    public class Todo
    {
        public long Id { get; set; }
        public string Content { get; set; }
        public int Order { get; set; }
        public bool Done { get; set; }
    }

    public class TodoService : Service
    {
        public static List<Todo> Todos = new List<Todo>();

        public object Get(Todo request)
        {
            if (request.Id != default(long))
                return Todos.FirstOrDefault(x => x.Id == request.Id);

            return Todos;
        }

        public Todo Post(Todo todo)
        {
            if (todo.Id == default(long))
                todo.Id = Todos.Max(x => x.Id) + 1;

            Todos.Add(todo);

            return todo;
        }

        public Todo Put(Todo todo)
        {
            return Post(todo);
        }

        public void Delete(Todo todo)
        {
            Todos.RemoveAll(x => x.Id == todo.Id);
        }
    }

    public class Global : System.Web.HttpApplication
    {
        protected void Application_Start(object sender, EventArgs e)
        {
            (new AppHost()).Init();
        }
    }
}